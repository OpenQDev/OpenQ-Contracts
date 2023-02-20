// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

/// @title ITieredBounty
/// @author FlacoJones
/// @notice Interface defining TieredBounty methods shared between TieredPercentageBounty and TieredFixedBounty
interface ITieredBounty is IBountyCore {
    /// @notice Sets a winner for a particular tier
    /// @param _tier The tier they won
    /// @param _winner The external UUID (e.g. an OpenQ User UUID) that won this tier
    function setTierWinner(string memory _winner, uint256 _tier) external;

    /// @notice Sets the payout schedule
    /// @param _payoutSchedule An array of payout volumes for each tier
    function setPayoutSchedule(uint256[] calldata _payoutSchedule) external;

    /// @notice Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
    function closeCompetition() external;

    /// @notice Sets tierClaimed to true for the given tier
    /// @param _tier The tier being claimed
    function setTierClaimed(uint256 _tier) external;

    /// @notice Transfers the tiered percentage of the token balance of _tokenAddress from bounty to _payoutAddress
    /// @param _payoutAddress The destination address for the fund
    /// @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
    /// @param _tokenAddress The token address being claimed
    function claimTiered(
        address _payoutAddress,
        uint256 _tier,
        address _tokenAddress
    ) external returns (uint256);

    // PUBLIC GETTERS
    function tierClaimed(uint256 _tier) external view returns (bool);

    function tierWinners(uint256) external view returns (string memory);

    function invoiceComplete(uint256) external view returns (bool);

    function supportingDocumentsComplete(uint256) external view returns (bool);

    function tier(bytes32) external view returns (uint256);

    function getPayoutSchedule() external view returns (uint256[] memory);

    function getTierWinners() external view returns (string[] memory);
}
