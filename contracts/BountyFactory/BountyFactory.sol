// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

/**
 * @dev Custom imports
 */
import '../OnlyOpenQ/OnlyOpenQ.sol';
import '../Bounty/Implementations/BountyV1.sol';
import '../Library/OpenQDefinitions.sol';

/**
 * @title BountyFactory
 * @dev Factory for deploying new BeaconProxy contracts for bounties. Holds BeaconBounty address passed to each bounty for retrieving their implementation
 */
contract BountyFactory is OnlyOpenQ {
    /**
     * INITIALIZATION
     */

    /**
     * @dev The address of the UpgradeableBeacon holding the current bounty implementation
     */
    address immutable beacon;

    /**
     * @dev Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
     * @param _openQ The OpenQProxy address
     * @param _beacon The UpgradeableBeacon "BountyBeacon" address
     */
    constructor(address _openQ, address _beacon) {
        __OnlyOpenQ_init(_openQ);

        beacon = _beacon;
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
     * @param _id A unique string representing the bounty
     * @param _issuer The creator of the mint transaction
     * @param _organization The organization associated with the bounty
     * @return address The address of the minted bounty
     */
    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization,
        OpenQDefinitions.InitOperation memory operation
    ) external onlyOpenQ returns (address) {
        BeaconProxy bounty = new BeaconProxy(
            beacon,
            abi.encodeWithSignature(
                'initialize(string,address,string,address,(uint32,bytes))',
                _id,
                _issuer,
                _organization,
                openQ(),
                operation
            )
        );

        return address(bounty);
    }

    /**
     * UTILITY
     */

    /**
     * @dev Returns the BountyBeacon address
     * @return address BountyBeacon address
     */
    function getBeacon() external view returns (address) {
        return beacon;
    }
}
