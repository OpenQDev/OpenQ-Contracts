// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Custom imports - all transitive imports live in BountyStorage
 */
import '../Storage/TieredFixedBountyStorage.sol';

/**
 * @title BountyV1
 * @dev Bounty Implementation Version 1
 */
contract TieredFixedBountyV1 is TieredFixedBountyStorageV1 {
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
            uint256[] memory _payoutSchedule,
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

        bountyType = OpenQDefinitions.TIERED_FIXED;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceable = _invoiceable;
        kycRequired = _kycRequired;
        supportingDocuments = _supportingDocuments;
        externalUserId = _externalUserId;
        payoutSchedule = _payoutSchedule;
        payoutTokenAddress = _fundingToken;

        // Initialize metadata arrays to same number of tiers
        tierWinners = new string[](_payoutSchedule.length);
        invoiceComplete = new bool[](_payoutSchedule.length);
        supportingDocumentsComplete = new bool[](_payoutSchedule.length);
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
     * @dev Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
     */
    function closeCompetition() external onlyClaimManager {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );

        status = OpenQDefinitions.CLOSED;
        bountyClosedTime = block.timestamp;
    }

    function setFundingGoal(address _fundingToken, uint256 _fundingGoal)
        external
        override
        onlyOpenQ
    {
        fundingGoal = _fundingGoal;
        fundingToken = _fundingToken;
        hasFundingGoal = true;

        payoutTokenAddress = _fundingToken;
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

        // Resize metadata arrays and copy current members to new array
        // NOTE: If resizing to fewer tiers than previously, the final indexes will be removed
        string[] memory newTierWinners = new string[](payoutSchedule.length);
        bool[] memory newInvoiceComplete = new bool[](payoutSchedule.length);
        bool[] memory newSupportingDocumentsCompleted = new bool[](
            payoutSchedule.length
        );

        for (uint256 i = 0; i < tierWinners.length; i++) {
            newTierWinners[i] = tierWinners[i];
        }
        tierWinners = newTierWinners;

        for (uint256 i = 0; i < invoiceComplete.length; i++) {
            newInvoiceComplete[i] = invoiceComplete[i];
        }
        invoiceComplete = newInvoiceComplete;

        for (uint256 i = 0; i < supportingDocumentsComplete.length; i++) {
            newSupportingDocumentsCompleted[i] = supportingDocumentsComplete[i];
        }
        supportingDocumentsComplete = newSupportingDocumentsCompleted;
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
