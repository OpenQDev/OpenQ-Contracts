// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/TieredFixedBountyStorage.sol';

/// @title TieredFixedBountyV1
/// @author FlacoJones
/// @notice Bounty implementation for tiered bounties with fixed amount for each tier
/// @dev TieredFixedBountyV1 -> TieredFixedBountyStorageV1 -> TieredBountyCore -> TieredBountyStorageCore -> BountyCore -> BountyStorageCore -> (Third Party Deps + Custom )
/// @dev Do not add any new storage variables here. Put them in a TieredPercentageBountyStorageV# and release new implementation
contract AttackBounty is TieredFixedBountyStorageV1 {
    constructor() {}

    function tierWinners(uint256 _tier) external view returns (string memory) {
        return 'myGithubId';
    }

    function supportingDocumentsComplete(
        uint256 _tier
    ) external view returns (bool) {
        return true;
    }

    function bountyType() external view returns (uint256) {
        return 3;
    }

    // other methods necessary to reach the emit ClaimSuccess() in ClaimManagerV1.sol
}
