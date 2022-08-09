// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';

/**
 * @title BountyBeacon
 * @dev UpgradeableBeacon holding the current bounty implementation referred to by all BeaconProxy bounties
 */
contract BountyBeacon is UpgradeableBeacon {
    /**
     * INITIALIZATION
     */

    /**
     * @dev Initializes an UpgradeableBeacon which will transmit the current implementation of Bounty to all BeaconProxy bounties
     * @param _implementation The initial implementation of Bounty
     */
    constructor(address _implementation) UpgradeableBeacon(_implementation) {}
}
