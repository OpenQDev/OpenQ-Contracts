// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Custom imports - all transitive imports live in BountyStorage
 */
import '../../Storage/BountyStorage.sol';

/**
 * @title BountyV3
 * @dev Bounty Implementation Version 3
 */
contract BountyV3 is BountyStorageV3 {
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

        _initByType(_operation);
    }

    /**
     * @dev Initializes a bounty based on its type
     * @param _operation The ABI encoded data determining the type of bounty being initialized and associated data
     */
    function _initByType(OpenQDefinitions.InitOperation memory _operation)
        internal
    {
        uint32 operationType = _operation.operationType;
        if (operationType == OpenQDefinitions.ATOMIC) {
            (
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
            _initAtomic(
                _hasFundingGoal,
                _fundingToken,
                _fundingGoal,
                _invoiceable,
                _kycRequired,
                _supportingDocuments,
                _externalUserId
            );
        } else if (operationType == OpenQDefinitions.ONGOING) {
            (
                address _payoutTokenAddress,
                uint256 _payoutVolume,
                bool _hasFundingGoal,
                address _fundingGoalToken,
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
            _initOngoingBounty(
                _payoutTokenAddress,
                _payoutVolume,
                _hasFundingGoal,
                _fundingGoalToken,
                _fundingGoal,
                _invoiceable,
                _kycRequired,
                _supportingDocuments,
                _externalUserId
            );
        } else if (operationType == OpenQDefinitions.TIERED) {
            (
                uint256[] memory _payoutSchedule,
                bool _hasFundingGoal,
                address _fundingGoalToken,
                uint256 _fundingGoal,
                bool _invoiceable,
                bool _kycRequired,
                bool _supportingDocuments,
                string memory _externalUserId,
                ,

            ) = abi.decode(
                    _operation.data,
                    (
                        uint256[],
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
            _initTiered(
                _payoutSchedule,
                _hasFundingGoal,
                _fundingGoalToken,
                _fundingGoal,
                _invoiceable,
                _kycRequired,
                _supportingDocuments,
                _externalUserId
            );
        } else if (operationType == OpenQDefinitions.TIERED_FIXED) {
            (
                uint256[] memory _payoutSchedule,
                address _payoutTokenAddress,
                bool _invoiceable,
                bool _kycRequired,
                bool _supportingDocuments,
                string memory _externalUserId,
                ,

            ) = abi.decode(
                    _operation.data,
                    (
                        uint256[],
                        address,
                        bool,
                        bool,
                        bool,
                        string,
                        string,
                        string
                    )
                );
            _initTieredFixed(
                _payoutSchedule,
                _payoutTokenAddress,
                _invoiceable,
                _kycRequired,
                _supportingDocuments,
                _externalUserId
            );
        } else {
            revert('OQ: unknown init operation type');
        }
    }

    /**
     * @dev Initializes an atomic contract (single contributor, single payout) with initial state
     * @param _hasFundingGoal If a funding goal has been set
     * @param _fundingToken The token address to be used for funding
     * @param _fundingGoal The funding token volume
     * @param _invoiceable Whether or not invoice is required
     * @param _kycRequired Whether or not KYC is required
     */
    function _initAtomic(
        bool _hasFundingGoal,
        address _fundingToken,
        uint256 _fundingGoal,
        bool _invoiceable,
        bool _kycRequired,
        bool _supportingDocuments,
        string memory _externalUserId
    ) internal {
        bountyType = OpenQDefinitions.ATOMIC;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceable = _invoiceable;
        kycRequired = _kycRequired;
        supportingDocuments = _supportingDocuments;
        externalUserId = _externalUserId;
    }

    /**
     * @dev Initializes an ongoing bounty (multiple contributors, fixed-price payout per submission) proxy with initial state
     * @param _payoutTokenAddress The token address for ongoing payouts
     * @param _payoutVolume The volume of token to payout for each successful claim
     * @param _hasFundingGoal If a funding goal has been set
     * @param _fundingToken The token address to be used for funding
     * @param _fundingGoal The funding token volume
     * @param _invoiceable Whether or not invoice is required
     * @param _kycRequired Whether or not KYC is required
     */
    function _initOngoingBounty(
        address _payoutTokenAddress,
        uint256 _payoutVolume,
        bool _hasFundingGoal,
        address _fundingToken,
        uint256 _fundingGoal,
        bool _invoiceable,
        bool _kycRequired,
        bool _supportingDocuments,
        string memory _externalUserId
    ) internal {
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
     * @dev Initializes a percentage-based tiered bounty (1st, 2nd, 3rd place etc, payout for each tier percentage of total prize) proxy with initial state
     * @param _payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
     * @param _hasFundingGoal If a funding goal has been set
     * @param _fundingToken The token address to be used for funding
     * @param _fundingGoal The funding token volume
     * @param _invoiceable Whether or not invoice is required
     * @param _kycRequired Whether or not KYC is required
     */
    function _initTiered(
        uint256[] memory _payoutSchedule,
        bool _hasFundingGoal,
        address _fundingToken,
        uint256 _fundingGoal,
        bool _invoiceable,
        bool _kycRequired,
        bool _supportingDocuments,
        string memory _externalUserId
    ) internal {
        bountyType = OpenQDefinitions.TIERED;

        uint256 sum;
        for (uint256 i = 0; i < _payoutSchedule.length; i++) {
            sum += _payoutSchedule[i];
        }
        require(sum == 100, Errors.PAYOUT_SCHEDULE_MUST_ADD_TO_100);

        payoutSchedule = _payoutSchedule;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceable = _invoiceable;
        kycRequired = _kycRequired;
        supportingDocuments = _supportingDocuments;
        externalUserId = _externalUserId;
    }

    /**
     * @dev Initializes a fixed tiered bounty (1st, 2nd, 3rd place etc, fixed payout for each tier) proxy with initial state
     * @param _payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
     * @param _payoutTokenAddress Fixed token address for funding
     * @param _invoiceable Whether or not invoice is required
     * @param _kycRequired Whether or not KYC is required
     */
    function _initTieredFixed(
        uint256[] memory _payoutSchedule,
        address _payoutTokenAddress,
        bool _invoiceable,
        bool _kycRequired,
        bool _supportingDocuments,
        string memory _externalUserId
    ) internal {
        bountyType = OpenQDefinitions.TIERED_FIXED;
        payoutSchedule = _payoutSchedule;
        payoutTokenAddress = _payoutTokenAddress;
        invoiceable = _invoiceable;
        kycRequired = _kycRequired;
        supportingDocuments = _supportingDocuments;
        externalUserId = _externalUserId;
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Creates a deposit and transfers tokens from msg.sender to this contract
     * @param _funder The funder's address
     * @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
     * @param _volume The volume of token to transfer
     * @param _expiration The duration until the deposit becomes refundable
     * @return (depositId, volumeReceived) Returns the deposit id and the amount transferred to bounty
     */
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    )
        external
        payable
        onlyDepositManager
        nonReentrant
        returns (bytes32, uint256)
    {
        require(_volume != 0, Errors.ZERO_VOLUME_SENT);
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        require(status == OpenQDefinitions.OPEN, Errors.CONTRACT_IS_CLOSED);

        bytes32 depositId = _generateDepositId();

        uint256 volumeReceived;
        if (_tokenAddress == address(0)) {
            volumeReceived = msg.value;
        } else {
            volumeReceived = _receiveERC20(_tokenAddress, _funder, _volume);
        }

        funder[depositId] = _funder;
        tokenAddress[depositId] = _tokenAddress;
        volume[depositId] = volumeReceived;
        depositTime[depositId] = block.timestamp;
        expiration[depositId] = _expiration;
        isNFT[depositId] = false;

        deposits.push(depositId);
        tokenAddresses.add(_tokenAddress);

        return (depositId, volumeReceived);
    }

    /**
     * @dev Creates a deposit and transfers NFT from msg.sender to self
     * @param _sender The funder address
     * @param _tokenAddress The ERC721 token address of the NFT
     * @param _tokenId The tokenId of the NFT to transfer
     * @param _expiration The duration until the deposit becomes refundable
     * @param _tier (optional) The tier associated with the bounty (only relevant if bounty type is tiered, otherwise is zero)
     * @return depositId
     */
    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        uint256 _tier
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
        tier[depositId] = _tier;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    /**
     * @dev Transfers volume of deposit or NFT of deposit from bounty to funder
     * @param _depositId The deposit to refund
     * @param _funder The initial funder of the deposit
     * @param _volume The volume to be refunded (only relevant if deposit is not an NFT, otherwise is zero)
     */
    function refundDeposit(
        bytes32 _depositId,
        address _funder,
        uint256 _volume
    ) external onlyDepositManager nonReentrant {
        require(refunded[_depositId] == false, Errors.DEPOSIT_ALREADY_REFUNDED);
        require(funder[_depositId] == _funder, Errors.CALLER_NOT_FUNDER);
        require(
            block.timestamp >= depositTime[_depositId] + expiration[_depositId],
            Errors.PREMATURE_REFUND_REQUEST
        );

        refunded[_depositId] = true;

        if (tokenAddress[_depositId] == address(0)) {
            _transferProtocolToken(funder[_depositId], _volume);
        } else if (isNFT[_depositId]) {
            _transferNft(
                tokenAddress[_depositId],
                funder[_depositId],
                tokenId[_depositId]
            );
        } else {
            _transferERC20(
                tokenAddress[_depositId],
                funder[_depositId],
                _volume
            );
        }
    }

    /**
     * @dev Extends deposit duration
     * @param _depositId The deposit to extend
     * @param _seconds Number of seconds to extend deposit
     * @param _funder The initial funder of the deposit
     */
    function extendDeposit(
        bytes32 _depositId,
        uint256 _seconds,
        address _funder
    ) external onlyDepositManager nonReentrant returns (uint256) {
        require(status == OpenQDefinitions.OPEN, Errors.CONTRACT_IS_CLOSED);
        require(refunded[_depositId] == false, Errors.DEPOSIT_ALREADY_REFUNDED);
        require(funder[_depositId] == _funder, Errors.CALLER_NOT_FUNDER);

        if (
            block.timestamp > depositTime[_depositId] + expiration[_depositId]
        ) {
            expiration[_depositId] =
                block.timestamp -
                depositTime[_depositId] +
                _seconds;
        } else {
            expiration[_depositId] = expiration[_depositId] + _seconds;
        }

        return expiration[_depositId];
    }

    /**
     * @dev Transfers full balance of _tokenAddress from bounty to _payoutAddress
     * @param _tokenAddress ERC20 token address or Zero Address for protocol token
     * @param _payoutAddress The destination address for the funds
     */
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
     * @dev Transfers the tiered percentage of the token balance of _tokenAddress from bounty to _payoutAddress
     * @param _payoutAddress The destination address for the fund
     * @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
     * @param _tokenAddress The token address being claimed
     */
    function claimTiered(
        address _payoutAddress,
        uint256 _tier,
        address _tokenAddress
    ) external onlyClaimManager nonReentrant returns (uint256) {
        require(
            bountyType == OpenQDefinitions.TIERED,
            Errors.NOT_A_TIERED_BOUNTY
        );
        require(!tierClaimed[_tier], Errors.TIER_ALREADY_CLAIMED);

        uint256 claimedBalance = (payoutSchedule[_tier] *
            fundingTotals[_tokenAddress]) / 100;

        _transferToken(_tokenAddress, claimedBalance, _payoutAddress);
        return claimedBalance;
    }

    /**
     * @dev Transfers the fixed amount of balance associated with the tier
     * @param _payoutAddress The destination address for the fund
     * @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
     */
    function claimTieredFixed(address _payoutAddress, uint256 _tier)
        external
        onlyClaimManager
        nonReentrant
        returns (uint256)
    {
        require(
            bountyType == OpenQDefinitions.TIERED_FIXED,
            Errors.NOT_A_TIERED_FIXED_BOUNTY
        );
        require(!tierClaimed[_tier], Errors.TIER_ALREADY_CLAIMED);

        uint256 claimedBalance = payoutSchedule[_tier];

        _transferToken(payoutTokenAddress, claimedBalance, _payoutAddress);
        return claimedBalance;
    }

    /**
     * @dev Transfers NFT from bounty address to _payoutAddress
     * @param _payoutAddress The destination address for the NFT
     * @param _depositId The payout address of the bounty
     */
    function claimNft(address _payoutAddress, bytes32 _depositId)
        external
        onlyClaimManager
        nonReentrant
    {
        _transferNft(
            tokenAddress[_depositId],
            _payoutAddress,
            tokenId[_depositId]
        );
    }

    /**
     * @dev Changes bounty status from 0 (OPEN) to 1 (CLOSED)
     * @param _payoutAddress The closer of the bounty
     * @param _closerData ABI-encoded data about the claimant and claimant asset
     */
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

    /**
     * @dev Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
     */
    function closeCompetition() external onlyClaimManager {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );

        status = OpenQDefinitions.CLOSED;
        bountyClosedTime = block.timestamp;

        for (uint256 i = 0; i < getTokenAddresses().length; i++) {
            address _tokenAddress = getTokenAddresses()[i];
            fundingTotals[_tokenAddress] = getTokenBalance(_tokenAddress);
        }
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
     * TRANSFER HELPERS
     */

    /**
     * @dev Returns token balance for both ERC20 or protocol token
     * @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
     */
    function getTokenBalance(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        if (_tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            return getERC20Balance(_tokenAddress);
        }
    }

    /**
     * @dev Returns the amount of locked tokens (of a specific token) on a bounty address, only available for claims but not for refunds
     * @param _bountyAddress Address of bounty
     * @param _depositId The depositId that determines which token is being looked at
     * @return uint256
     */
    function getLockedFunds(address _bountyAddress, address _depositId)
        public
        view
        returns (uint256)
    {
        BountyV3 bounty = BountyV3(payable(_bountyAddress));

        uint256 lockedFunds;
        bytes32[] memory depList = bounty.getDeposits();
        for (uint256 i = 0; i < depList.length; i++) {
            if (
                block.timestamp <
                bounty.depositTime(depList[i]) +
                    bounty.expiration(depList[i]) &&
                bounty.tokenAddress(depList[i]) == _depositId
            ) {
                lockedFunds += bounty.volume(depList[i]);
            }
        }

        return lockedFunds;
    }

    /**
     * @dev Transfers _volume of both ERC20 or protocol token to _payoutAddress
     * @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
     * @param _volume Volume to transfer
     * @param _payoutAddress Destination address
     */
    function _transferToken(
        address _tokenAddress,
        uint256 _volume,
        address _payoutAddress
    ) internal {
        if (_tokenAddress == address(0)) {
            _transferProtocolToken(_payoutAddress, _volume);
        } else {
            _transferERC20(_tokenAddress, _payoutAddress, _volume);
        }
    }

    /**
     * @dev Receives _volume of ERC20 at _tokenAddress from _funder to bounty address
     * @param _tokenAddress The ERC20 token address
     * @param _funder The funder of the bounty
     * @param _volume The volume of token to transfer
     */
    function _receiveERC20(
        address _tokenAddress,
        address _funder,
        uint256 _volume
    ) internal returns (uint256) {
        uint256 balanceBefore = getERC20Balance(_tokenAddress);
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransferFrom(_funder, address(this), _volume);
        uint256 balanceAfter = getERC20Balance(_tokenAddress);
        require(
            balanceAfter >= balanceBefore,
            Errors.TOKEN_TRANSFER_IN_OVERFLOW
        );

        /* The reason we take the balanceBefore and balanceAfter rather than the raw volume
         * is because certain ERC20 contracts ( e.g. USDT) take fees on transfers.
         * Therefore the volume received after transferFrom can be lower than the raw volume sent by the sender */
        return balanceAfter - balanceBefore;
    }

    /**
     * @dev Transfers _volume of ERC20 at _tokenAddress from bounty address to _funder
     * @param _tokenAddress The ERC20 token address
     * @param _payoutAddress The destination address of the funds
     * @param _volume The volume of token to transfer
     */
    function _transferERC20(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _volume
    ) internal {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransfer(_payoutAddress, _volume);
    }

    /**
     * @dev Transfers _volume of protocol token from bounty address to _payoutAddress
     * @param _payoutAddress The destination address of the funds
     * @param _volume The volume of token to transfer
     */
    function _transferProtocolToken(address _payoutAddress, uint256 _volume)
        internal
    {
        payable(_payoutAddress).sendValue(_volume);
    }

    /**
     * @dev Receives NFT of _tokenId on _tokenAddress from _funder to bounty address
     * @param _tokenAddress The ERC721 token address
     * @param _sender The sender of the NFT
     * @param _tokenId The tokenId
     */
    function _receiveNft(
        address _tokenAddress,
        address _sender,
        uint256 _tokenId
    ) internal {
        IERC721Upgradeable nft = IERC721Upgradeable(_tokenAddress);
        nft.safeTransferFrom(_sender, address(this), _tokenId);
    }

    /**
     * @dev Transfers NFT of _tokenId on _tokenAddress from bounty address to _payoutAddress
     * @param _tokenAddress The ERC721 token address
     * @param _payoutAddress The sender of the NFT
     * @param _tokenId The tokenId
     */
    function _transferNft(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _tokenId
    ) internal {
        IERC721Upgradeable nft = IERC721Upgradeable(_tokenAddress);
        nft.safeTransferFrom(address(this), _payoutAddress, _tokenId);
    }

    /**
     * SETTERS
     */

    /**
     * @dev Sets tierClaimed to true for the given tier
     * @param _tier The tier being claimed
     */
    function setTierClaimed(uint256 _tier) external onlyClaimManager {
        tierClaimed[_tier] = true;
    }

    /**
     * @dev Sets the funding goal
     * @param _fundingToken Token address for funding goal
     * @param _fundingGoal Token volume for funding goal
     */
    function setFundingGoal(address _fundingToken, uint256 _fundingGoal)
        external
        onlyOpenQ
    {
        fundingGoal = _fundingGoal;
        fundingToken = _fundingToken;
        hasFundingGoal = true;
    }

    /**
     * @dev Whether or not the Bounty is invoiceable
     * @param _invoiceable Whether or not the Bounty is invoiceable
     */
    function setInvoiceable(bool _invoiceable) external onlyOpenQ {
        invoiceable = _invoiceable;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _kycRequired Whether or not KYC is required to fund and claim the bounty
     */
    function setKycRequired(bool _kycRequired) external onlyOpenQ {
        kycRequired = _kycRequired;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _supportingDocuments Whether or not KYC is required to fund and claim the bounty
     */
    function setSupportingDocuments(bool _supportingDocuments)
        external
        onlyOpenQ
    {
        supportingDocuments = _supportingDocuments;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _invoiceComplete Whether or not KYC is required to fund and claim the bounty
     */
    function setInvoiceComplete(bool _invoiceComplete) external onlyOpenQ {
        invoiceComplete = _invoiceComplete;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _supportingDocumentsComplete Whether or not KYC is required to fund and claim the bounty
     */
    function setSupportingDocumentsComplete(bool _supportingDocumentsComplete)
        external
        onlyOpenQ
    {
        supportingDocumentsComplete = _supportingDocumentsComplete;
    }

    /**
     * @dev Sets the funding goal
     * @param _payoutTokenAddress Sets payout token address
     * @param _payoutVolume Sets payout token volume
     */
    function setPayout(address _payoutTokenAddress, uint256 _payoutVolume)
        external
        onlyOpenQ
    {
        payoutTokenAddress = _payoutTokenAddress;
        payoutVolume = _payoutVolume;
    }

    /**
     * @dev Sets the payout schedule
     * @dev There is no tokenAddress needed here - payouts on percentage tiered bounties is a percentage of whatever is deposited on the contract
     * @param _payoutSchedule An array of payout volumes for each tier
     */
    function setPayoutSchedule(uint256[] calldata _payoutSchedule)
        external
        onlyOpenQ
    {
        require(
            bountyType == OpenQDefinitions.TIERED,
            Errors.NOT_A_TIERED_BOUNTY
        );
        uint256 sum;
        for (uint256 i = 0; i < _payoutSchedule.length; i++) {
            sum += _payoutSchedule[i];
        }
        require(sum == 100, Errors.PAYOUT_SCHEDULE_MUST_ADD_TO_100);

        payoutSchedule = _payoutSchedule;
    }

    /**
     * @dev Sets the payout schedule
     * @param _payoutSchedule An array of payout volumes for each tier
     * @param _payoutTokenAddress The address of the token to be used for the payout
     */
    function setPayoutScheduleFixed(
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external onlyOpenQ {
        require(
            bountyType == OpenQDefinitions.TIERED_FIXED,
            Errors.NOT_A_FIXED_TIERED_BOUNTY
        );
        payoutSchedule = _payoutSchedule;
        payoutTokenAddress = _payoutTokenAddress;
    }

    function setTierWinner(string memory winner, uint256 tier)
        external
        onlyOpenQ
    {
        tierWinners[tier] = winner;
    }

    /**
     * UTILITY
     */

    /**
     * @dev Generates a unique deposit ID from bountyId and the current length of deposits
     */
    function _generateDepositId() internal view returns (bytes32) {
        return keccak256(abi.encode(bountyId, deposits.length));
    }

    /**
     * @dev Generates a unique claimant ID from user and asset
     */
    function _generateClaimantId(
        string memory claimant,
        string memory claimantAsset
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(claimant, claimantAsset));
    }

    /**
     * @dev Returns the ERC20 balance for this bounty address
     * @param _tokenAddress The ERC20 token address
     * @return balance The ERC20 balance for this bounty address
     */
    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        return token.balanceOf(address(this));
    }

    /**
     * @dev Returns an array of all deposits (ERC20, protocol token, and NFT) for this bounty
     * @return deposits The array of deposits including ERC20, protocol token, and NFT
     */
    function getDeposits() external view returns (bytes32[] memory) {
        return deposits;
    }

    /**
     * @dev Returns an array for the payoutSchedule
     * @return payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
     */
    function getPayoutSchedule() external view returns (uint256[] memory) {
        return payoutSchedule;
    }

    /**
     * @dev Returns an array of ONLY NFT deposits for this bounty
     * @return nftDeposits The array of NFT deposits
     */
    function getNftDeposits() external view returns (bytes32[] memory) {
        return nftDeposits;
    }

    /**
     * @dev Returns an array of all ERC20 token addresses which have funded this bounty
     * @return tokenAddresses An array of all ERC20 token addresses which have funded this bounty
     */
    function getTokenAddresses() public view returns (address[] memory) {
        return tokenAddresses.values();
    }

    /**
     * @dev Returns the total number of unique tokens deposited on the bounty
     * @return tokenAddressesCount The length of the array of all ERC20 token addresses which have funded this bounty
     */
    function getTokenAddressesCount() external view returns (uint256) {
        return tokenAddresses.values().length;
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
