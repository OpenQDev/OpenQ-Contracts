// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Custom imports - all transitive imports live in BountyStorage
 */
import '../Storage/OngoingBountyStorage.sol';

/**
 * @title BountyV1
 * @dev Bounty Implementation Version 1
 */
contract TieredBountyV1 is OngoingBountyStorageV1 {
    /**
     * INITIALIZATION
     */

    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    constructor() {}

    /**
     * @dev Initializes a bounty proxy with initial state
     * @param _bountyId The unique bounty identifier
     * @param _issuer The sender of the mint bounty transaction
     * @param _organization The organization associated with the bounty
     * @param _openQ The OpenQProxy address
     * @param _claimManager The Claim Manager proxy address
     * @param _depositManager The Deposit Manager proxy address
     * @param _operation The ABI encoded data determining the type of bounty being initialized and associated data
     */
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
            address _payoutTokenAddress,
            uint256 _payoutVolume,
            bool _hasFundingGoal,
            address _fundingToken,
            uint256 _fundingGoal,
            bool _invoiceable,
            bool _kycRequired,
            bool _supportingDocuments,
            string memory _externalUserId,
            ,

        ) = abi.decode(
                _operation.data,
                (
                    address,
                    uint256,
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

        bountyType = OpenQDefinitions.ONGOING;
        payoutTokenAddress = _payoutTokenAddress;
        payoutVolume = _payoutVolume;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceable = _invoiceable;
        kycRequired = _kycRequired;
        supportingDocuments = _supportingDocuments;
        externalUserId = _externalUserId;
    }

    /**
     * @dev Transfers a payout amount of an ongoing bounty to claimant for claimant asset
     * @param _payoutAddress The destination address for the funds
     * @param _closerData ABI-encoded data of the claimant and claimant asset
     */
    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external onlyClaimManager nonReentrant returns (address, uint256) {
        (, string memory claimant, , string memory claimantAsset) = abi.decode(
            _closerData,
            (address, string, address, string)
        );

        bytes32 _claimantId = _generateClaimantId(claimant, claimantAsset);

        claimantId[_claimantId] = true;

        _transferToken(payoutTokenAddress, payoutVolume, _payoutAddress);
        return (payoutTokenAddress, payoutVolume);
    }

    /**
     * @dev Similar to close() for single priced bounties. Stops all withdrawls.
     * @param _closer Address of the closer
     */
    function closeOngoing(address _closer) external onlyOpenQ {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );
        require(_closer == issuer, Errors.CALLER_NOT_ISSUER);

        status = OpenQDefinitions.CLOSED;
        bountyClosedTime = block.timestamp;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _data Whether or not KYC is required to fund and claim the bounty
     */
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        (string memory _claimId, bool _invoiceComplete) = abi.decode(
            _data,
            (string, bool)
        );
        invoiceComplete[_claimId] = _invoiceComplete;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _data Whether or not KYC is required to fund and claim the bounty
     */
    function setSupportingDocumentsComplete(bytes calldata _data)
        external
        onlyOpenQ
    {
        (string memory _claimId, bool _supportingDocumentsComplete) = abi
            .decode(_data, (string, bool));
        supportingDocumentsComplete[_claimId] = _supportingDocumentsComplete;
    }

    /**
     * @dev receive() method to accept protocol tokens
     */
    receive() external payable {
        revert(
            'Cannot send Ether directly to boutny contract. Please use the BountyV1.receiveFunds() method.'
        );
    }
}
