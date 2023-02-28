// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/TieredFixedBountyStorage.sol';

/// @title TieredFixedBountyV1
/// @author FlacoJones
/// @notice Bounty implementation for tiered bounties with fixed amount for each tier
/// @dev TieredFixedBountyV1 -> TieredFixedBountyStorageV1 -> TieredBountyCore -> TieredBountyStorageCore -> BountyCore -> BountyStorageCore -> (Third Party Deps + Custom )
/// @dev Do not add any new storage variables here. Put them in a TieredPercentageBountyStorageV# and release new implementation
contract TieredFixedBountyV1 is TieredFixedBountyStorageV1 {
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
    /// @dev see IBountyCore.initialize.(_operation) for _operation ABI encoding schema for TIERED FIXED
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

        (
            uint256[] memory _payoutSchedule,
            address _payoutTokenAddress,
            bool _invoiceRequired,
            bool _kycRequired,
            bool _supportingDocumentsRequired,
            string memory _issuerExternalUserId,
            ,

        ) = abi.decode(
                _operation.data,
                (uint256[], address, bool, bool, bool, string, string, string)
            );

        bountyType = OpenQDefinitions.TIERED_FIXED;
        payoutSchedule = _payoutSchedule;
        payoutTokenAddress = _payoutTokenAddress;
        invoiceRequired = _invoiceRequired;
        kycRequired = _kycRequired;
        supportingDocumentsRequired = _supportingDocumentsRequired;
        issuerExternalUserId = _issuerExternalUserId;

        // Initialize metadata arrays to same number of tiers
        tierWinners = new string[](_payoutSchedule.length);
        invoiceComplete = new bool[](_payoutSchedule.length);
        supportingDocumentsComplete = new bool[](_payoutSchedule.length);
    }

    /// @notice Transfers the fixed amount of balance associated with the tier
    /// @param _payoutAddress The destination address for the fund
    /// @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
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

    /// @notice Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
    function closeCompetition() external onlyClaimManager {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );

        status = OpenQDefinitions.CLOSED;
        bountyClosedTime = block.timestamp;
    }

    /// @notice Sets fundingGoal for bounty with id _bountyId
    /// @param _fundingToken The token address to be used for the funding goal
    /// @param _fundingGoal The volume of token to be used for the funding goal
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

    /// @notice Sets the payout schedule
    /// @param _payoutSchedule An array of payout volumes for each tier
    /// @param _payoutTokenAddress The address of the token to be used for the payout
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

    /// @notice receive() method to accept protocol tokens
    receive() external payable {
        revert(
            'Cannot send Ether directly to boutny contract. Please use the BountyV1.receiveFunds() method.'
        );
    }
}
