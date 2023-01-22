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
    address immutable atomicBountyBeacon;
    address immutable ongoingBountyBeacon;
    address immutable tieredBountyBeacon;
    address immutable tieredFixedBountyBeacon;

    /**
     * @dev Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
     * @param _openQ The OpenQProxy address
     * @param _atomicBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Atomic contracts
     * @param _ongoingBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Ongoing contracts
     * @param _tieredBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Tiered contracts
     * @param _tieredFixedBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Tiered Fixed contracts
     */
    constructor(
        address _openQ,
        address _atomicBountyBeacon,
        address _ongoingBountyBeacon,
        address _tieredBountyBeacon,
        address _tieredFixedBountyBeacon
    ) {
        __OnlyOpenQ_init(_openQ);

        atomicBountyBeacon = _atomicBountyBeacon;
        ongoingBountyBeacon = _ongoingBountyBeacon;
        tieredBountyBeacon = _tieredBountyBeacon;
        tieredFixedBountyBeacon = _tieredFixedBountyBeacon;
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

        address beaconProxy;

        if (operationType == OpenQDefinitions.ATOMIC) {
            beaconProxy = atomicBountyBeacon;
        } else if (operationType == OpenQDefinitions.ONGOING) {
            beaconProxy = ongoingBountyBeacon;
        } else if (operationType == OpenQDefinitions.TIERED) {
            beaconProxy = tieredBountyBeacon;
        } else {
            beaconProxy = tieredFixedBountyBeacon;
        }

        BeaconProxy bounty = new BeaconProxy(
            beaconProxy,
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

        return address(bounty);
    }
}
