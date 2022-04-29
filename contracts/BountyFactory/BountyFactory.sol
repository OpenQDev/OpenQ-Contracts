// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

// Third Party
import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

// Custom
import '../OnlyOpenQ/OnlyOpenQ.sol';

/// @title BountyFactory
/// @author OpenQ
/// @dev Factory for deploying new BeaconProxy contracts for bounties. Holds BeaconBounty address passed to each bounty for retrieving their implementation
contract BountyFactory is OnlyOpenQ {
    /*///////////////////////////////////////////////////////////////
												INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    // The address of the UpgradeableBeacon holding the current bounty implementation
    address immutable beacon;

    /**
		Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
		@param _openQ The OpenQProxy address
		@param _beacon The UpgradeableBeacon "BountyBeacon" address
		 */
    constructor(address _openQ, address _beacon) {
        __OnlyOpenQ_init(_openQ);

        beacon = _beacon;
    }

    /*///////////////////////////////////////////////////////////////
												TRANSACTIONS
    //////////////////////////////////////////////////////////////*/

    /**
		Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
		@param _id A unique string representing the bounty
		@param _issuer The creator of the mint transaction
		@param _organization The organization associated with the bounty
		@return address The address of the minted bounty
		 */
    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization
    ) external onlyOpenQ returns (address) {
        BeaconProxy bounty = new BeaconProxy(
            beacon,
            abi.encodeWithSignature(
                'initialize(string,address,string,address)',
                _id,
                _issuer,
                _organization,
                openQ()
            )
        );

        return address(bounty);
    }

    /*///////////////////////////////////////////////////////////////
												UTILITY
    //////////////////////////////////////////////////////////////*/

    /**
		Returns the BountyBeacon address
		@return address BountyBeacon address
		 */
    function getBeacon() external view returns (address) {
        return beacon;
    }
}
