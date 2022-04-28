// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';
import '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';

import '../Bounty/Implementations/BountyV0.sol';

contract BountyFactory is OpenQOnlyAccess {
    /*///////////////////////////////////////////////////////////////
												INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    address immutable beacon;

    constructor(address _openQ, address _beacon) {
        beacon = _beacon;
        __OpenQOnlyAccess_init(_openQ);
    }

    /*///////////////////////////////////////////////////////////////
												TRANSACTIONS
    //////////////////////////////////////////////////////////////*/

    /**
		Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
		@param _id A unique string representing the bounty
		@param _issuer The creator of the mint transaction
		@param _organization The organization associated with the bounty
		@param _openQ The address of the OpenQProxy, necessary for onlyOpenQ protected methods
		@return address The address of the minted bounty
		 */
    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization,
        address _openQ
    ) external onlyOpenQ returns (address) {
        BeaconProxy bounty = new BeaconProxy(
            beacon,
            abi.encodeWithSignature(
                'initialize(string,address,string,address)',
                _id,
                _issuer,
                _organization,
                _openQ
            )
        );

        return address(bounty);
    }
}
