// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/AtomicBountyStorage.sol';

/// @title AtomicBountyV1
/// @author FlacoJones
/// @notice Bounty implementation for single contributor, single payout scenarios (e.g. 500 USDC for a single work completion)
/// @dev AtomicBountyV1 -> AtomicBountyStorageV1 -> BountyCore -> BountyStorageCore -> Core Dependencies (OZ + Custom)
/// @dev Do not add any new storage variables here. Put them in a AtomicBountyStorageV# and release new implementation
contract AtomicBountyV1 is AtomicBountyStorageV1 {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    constructor() {}

    /// @notice Initializes a bounty proxy with initial state
    /// @param _bountyId The unique bounty identifier
    /// @param _issuer The sender of the mint bounty transaction
    /// @param _organization The organization associated with the bounty
    /// @param _openQ The OpenQProxy address
    /// @param _claimManager The Claim Manager proxy address
    /// @param _depositManager The Deposit Manager proxy address
    /// @param _operation The ABI encoded data determining the type of bounty being initialized and associated data
    /// @dev see IBountyCore.initialize.(_operation) for _operation ABI encoding schema for ATOMIC
    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ,
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory _operation
    ) external initializer {
        require(bytes(_bountyId).length != 0, Errors.NO_EMPTY_BOUNTY_ID);
        require(bytes(_organization).length != 0, Errors.NO_EMPTY_ORGANIZATION);

        __ReentrancyGuard_init();

        __OnlyOpenQ_init(_openQ);
        __ClaimManagerOwnable_init(_claimManager);
        __DepositManagerOwnable_init(_depositManager);

        bountyId = _bountyId;
        issuer = _issuer;
        organization = _organization;
        bountyCreatedTime = block.timestamp;
        nftDepositLimit = 5;

        (
            bool _hasFundingGoal,
            address _fundingToken,
            uint256 _fundingGoal,
            bool _invoiceRequired,
            bool _kycRequired,
            bool _supportingDocumentsRequired,
            string memory _issuerExternalUserId,
            ,

        ) = abi.decode(
                _operation.data,
                (
                    bool,
                    address,
                    uint256,
                    bool,
                    bool,
                    bool,
                    string,
                    string,
                    string
                )
            );

        bountyType = OpenQDefinitions.ATOMIC;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceRequired = _invoiceRequired;
        kycRequired = _kycRequired;
        supportingDocumentsRequired = _supportingDocumentsRequired;
        issuerExternalUserId = _issuerExternalUserId;
    }

    /// @notice Transfers full balance of _tokenAddress from bounty to _payoutAddress
    /// @param _tokenAddress ERC20 token address or Zero Address for protocol token
    /// @param _payoutAddress The destination address for the funds
    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        onlyClaimManager
        nonReentrant
        returns (uint256)
    {
        uint256 claimedBalance = getTokenBalance(_tokenAddress);
        _transferToken(_tokenAddress, claimedBalance, _payoutAddress);
        return claimedBalance;
    }

    /// @notice Changes bounty status from 0 (OPEN) to 1 (CLOSED)
    /// @param _payoutAddress The closer of the bounty
    /// @param _closerData ABI-encoded data about the claimant and claimant asset (see IBountyAtomic for data spec)
    /// @dev See IAtomicBounty.close.(_closerData)for _closerData ABI encoding schema
    function close(address _payoutAddress, bytes calldata _closerData)
        external
        onlyClaimManager
    {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );
        require(_payoutAddress != address(0), Errors.NO_ZERO_ADDRESS);
        status = OpenQDefinitions.CLOSED;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        closerData = _closerData;
    }

    /// @notice Whether or not invoice has been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setInvoiceComplete.(_data) for _data ABI encoding schema
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        bool _invoiceComplete = abi.decode(_data, (bool));
        invoiceComplete = _invoiceComplete;
    }

    /// @notice Whether or not supporting documents have been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setSupportingDocumentsComplete.(_data) for _data ABI encoding schema
    function setSupportingDocumentsComplete(bytes calldata _data)
        external
        onlyOpenQ
    {
        bool _supportingDocumentsComplete = abi.decode(_data, (bool));
        supportingDocumentsComplete = _supportingDocumentsComplete;
    }

    /// @notice Receives an NFT for this contract
    /// @param _sender Sender of the NFT
    /// @param _tokenAddress NFT token address
    /// @param _tokenId NFT token id
    /// @param _expiration How long before this deposit becomes refundable
    /// @return bytes32 the deposit id
    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata
    ) external onlyDepositManager nonReentrant returns (bytes32) {
        require(
            nftDeposits.length < nftDepositLimit,
            Errors.NFT_DEPOSIT_LIMIT_REACHED
        );
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId();

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    /// @notice Returns whether or not invoice is completed
    /// @return True if completed, false otherwise
    /// @dev We return from all getInvoiceComplete as bytes to accomodate different return types
    function getInvoiceComplete() external view returns (bytes memory) {
        return abi.encode(invoiceComplete);
    }

    /// @notice Returns whether or not supporting documents have been completed
    /// @return True if completed, false otherwise
    /// @dev We return from all IBountyCore.getSupportingDocumentsComplete() as bytes to accomodate different return types
    function getSupportingDocumentsComplete()
        external
        view
        returns (bytes memory)
    {
        return abi.encode(supportingDocumentsComplete);
    }

    /// @notice receive() method to accept protocol tokens
    receive() external payable {
        revert(
            'Cannot send Ether directly to boutny contract. Please use the BountyV1.receiveFunds() method.'
        );
    }
}
