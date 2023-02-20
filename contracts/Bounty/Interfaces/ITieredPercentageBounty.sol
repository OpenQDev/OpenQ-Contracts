// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';
import './ITieredBounty.sol';

/// @title ITieredPercentageBounty
/// @author FlacoJones
/// @notice Interface defining TieredPercentageBounty specific methods
interface ITieredPercentageBounty is IBountyCore, ITieredBounty {
    /// @notice Sets the payout schedule
    /// @notice There is no tokenAddress needed here - payouts on percentage tiered bounties is a percentage of whatever is deposited on the contract
    /// @param _payoutSchedule An array of payout volumes for each tier
    function setPayoutSchedule(uint256[] calldata _payoutSchedule) external;

    /// @notice Transfers the tiered percentage of the token balance of _tokenAddress from bounty to _payoutAddress
    /// @param _payoutAddress The destination address for the fund
    /// @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
    /// @param _tokenAddress The token address being claimed
    /// @return Volume of claimed token payout
    function claimTiered(
        address _payoutAddress,
        uint256 _tier,
        address _tokenAddress
    ) external returns (uint256);
}
