// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

/// @title IOngoingBounty
/// @author FlacoJones
/// @notice Interface defining OngoingBounty specific methods
interface IOngoingBounty is IBountyCore {
    /// @notice Sets the payout for an ongoing bounty
    /// @param _payoutTokenAddress Sets payout token address
    /// @param _payoutVolume Sets payout token volume
    function setPayout(address _payoutTokenAddress, uint256 _payoutVolume)
        external;

    /// @notice Transfers a payout amount of an ongoing bounty to claimant for claimant asset
    /// @param _payoutAddress The destination address for the funds
    /// @param _closerData ABI-encoded data of the claimant and claimant asset
    /// @dev _closerData (address,string,address,string,uint256)
    /// @dev _closerData (bountyAddress, externalUserId, closer, claimantAsset, tier)
    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external returns (address, uint256);

    /// @notice Similar to close() for single priced bounties. Stops all withdrawls.
    /// @param _closer Address of the closer
    function closeOngoing(address _closer) external;

    // PUBLIC GETTERS
    function payoutTokenAddress() external view returns (address);

    function payoutVolume() external view returns (uint256);

    function claimId(bytes32) external view returns (bool);
}
