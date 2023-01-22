// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

/**
 * @dev Custom imports
 */
import '../OnlyOpenQ/OnlyOpenQ.sol';
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
    address immutable atomicBountyBeacon;

    /**
     * @dev Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
     * @param _openQ The OpenQProxy address
     * @param _beacon The UpgradeableBeacon "BountyBeacon" address
     */
    constructor(
        address _openQ,
        address _beacon,
        address _atomicBountyBeacon
    ) {
        __OnlyOpenQ_init(_openQ);

        atomicBountyBeacon = _atomicBountyBeacon;
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
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory operation
    ) external onlyOpenQ returns (address) {
        uint32 operationType = operation.operationType;

        BeaconProxy bounty;

        if (operationType == OpenQDefinitions.ATOMIC) {
            bounty = new BeaconProxy(
                atomicBountyBeacon,
                abi.encodeWithSignature(
                    'initialize(string,address,string,address,address,address,(uint32,bytes))',
                    _id,
                    _issuer,
                    _organization,
                    openQ(),
                    _claimManager,
                    _depositManager,
                    operation
                )
            );
        } else {
            bounty = new BeaconProxy(
                beacon,
                abi.encodeWithSignature(
                    'initialize(string,address,string,address,address,address,(uint32,bytes))',
                    _id,
                    _issuer,
                    _organization,
                    openQ(),
                    _claimManager,
                    _depositManager,
                    operation
                )
            );
        }

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
