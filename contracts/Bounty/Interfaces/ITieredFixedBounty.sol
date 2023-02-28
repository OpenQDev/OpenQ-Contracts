// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';
import './ITieredBounty.sol';

/// @title ITieredFixedBounty
/// @author FlacoJones
/// @notice Interface defining TieredFixedBounty specific methods
interface ITieredFixedBounty is IBountyCore, ITieredBounty {
    /// @notice Sets the payout schedule
    /// @param _payoutSchedule An array of payout volumes for each tier
    /// @param _payoutTokenAddress The address of the token to be used for the payout
    function setPayoutScheduleFixed(
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external;

    /// @notice Transfers the fixed amount of balance associated with the tier
    /// @param _payoutAddress The destination address for the fund
    /// @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
    function claimTieredFixed(address _payoutAddress, uint256 _tier)
        external
        returns (uint256);

    function payoutTokenAddress() external returns (address);
}
