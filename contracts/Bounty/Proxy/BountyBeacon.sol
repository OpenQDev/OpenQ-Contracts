// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';

/// @title BountyBeacon
/// @author FlacoJones
/// @notice UpgradeableBeacon holding the current bounty implementation referred to by all BeaconProxy bounties
contract BountyBeacon is UpgradeableBeacon {
    /// @notice Initializes an UpgradeableBeacon which will transmit the current implementation of Bounty to all BeaconProxy bounties
    /// @param _implementation The initial implementation of Bounty
    constructor(address _implementation) UpgradeableBeacon(_implementation) {}
}
