// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';

contract BountyBeacon is UpgradeableBeacon {
    /*///////////////////////////////////////////////////////////////
												INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /**
		Initializes an UpgradeableBeacon which will transmit the current implementation of Bounty to all BeaconProxy bounties
		@param implementation_ The initial implementation of Bounty
		 */
    constructor(address implementation_) UpgradeableBeacon(implementation_) {}
}
