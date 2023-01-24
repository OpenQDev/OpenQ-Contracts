// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/TieredPercentageBountyStorage.sol';

/// @title TieredPercentageBountyV1
/// @notice TieredPercentageBountyV1 is a bounty implementation contract for single contributor, single payout circumstances
/// @dev TieredPercentageBountyV1 -> TieredPercentageBountyStorageV1 -> TieredBountyCore -> TieredBountyStorageCore -> (BountyCore -> BountyStorageCore) -> (Third Party Deps + Custom )
/// @dev Do not add any new storage variables here. Put them in a TieredPercentageBountyStorageV# and release new implementation
contract TieredPercentageBountyV1 is TieredPercentageBountyStorageV1 {
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
		/// @dev see IBountyCore.initialize.(_operation) for _operation ABI encoding schema for TIERED PERCENTAGE
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
            bool _invoiceRequired,
            bool _kycRequired,
            bool _supportingDocumentsRequired,
            string memory _issuerExternalUserId,
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

        uint256 sum;
        for (uint256 i = 0; i < _payoutSchedule.length; i++) {
            sum += _payoutSchedule[i];
        }
        require(sum == 100, Errors.PAYOUT_SCHEDULE_MUST_ADD_TO_100);
        payoutSchedule = _payoutSchedule;

        bountyType = OpenQDefinitions.TIERED;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceRequired = _invoiceRequired;
        kycRequired = _kycRequired;
        supportingDocumentsRequired = _supportingDocumentsRequired;
        issuerExternalUserId = _issuerExternalUserId;

        // Initialize metadata arrays to same number of tiers
        tierWinners = new string[](_payoutSchedule.length);
        invoiceComplete = new bool[](_payoutSchedule.length);
        supportingDocumentsComplete = new bool[](_payoutSchedule.length);
    }

    /// @notice Transfers the tiered percentage of the token balance of _tokenAddress from bounty to _payoutAddress
    /// @param _payoutAddress The destination address for the fund
    /// @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
    /// @param _tokenAddress The token address being claimed
    /// @return Volume of claimed token payout
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

    /// @notice Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
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

    /// @notice Sets the payout schedule
    /// @notice There is no tokenAddress needed here - payouts on percentage tiered bounties is a percentage of whatever is deposited on the contract
    /// @param _payoutSchedule An array of payout volumes for each tier
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
