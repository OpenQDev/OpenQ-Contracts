// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

import '../OnlyOpenQ/OnlyOpenQ.sol';
import '../Library/OpenQDefinitions.sol';
import '../Library/Errors.sol';

/// @title BountyFactory
/// @author FlacoJones
/// @notice Factory contract to deploy upgradeable beacon proxies for each type of bounty
contract BountyFactory is OnlyOpenQ {
    /// @notice The address of the UpgradeableBeacon holding the current bounty implementation
    address public immutable atomicBountyBeacon;
    address public immutable ongoingBountyBeacon;
    address public immutable tieredPercentageBountyBeacon;
    address public immutable tieredFixedBountyBeacon;

    /// @notice Deploys and initializes a new BeaconProxy with implementation pulled from the appropriate BountyBeacon
    /// @param _openQ The OpenQProxy address, used to initialize OnlyOpenQ
    /// @param _atomicBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Atomic contracts
    /// @param _ongoingBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Ongoing contracts
    /// @param _tieredPercentageBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Tiered contracts
    /// @param _tieredFixedBountyBeacon The UpgradeableBeacon "BountyBeacon" address for Tiered Fixed contracts
    constructor(
        address _openQ,
        address _atomicBountyBeacon,
        address _ongoingBountyBeacon,
        address _tieredPercentageBountyBeacon,
        address _tieredFixedBountyBeacon
    ) {
        __OnlyOpenQ_init(_openQ);

        atomicBountyBeacon = _atomicBountyBeacon;
        ongoingBountyBeacon = _ongoingBountyBeacon;
        tieredPercentageBountyBeacon = _tieredPercentageBountyBeacon;
        tieredFixedBountyBeacon = _tieredFixedBountyBeacon;
    }

    /// @dev Deploys and initializes a new BeaconProxy with implementation pulled from BountyBeacon
    /// @param _id A UUID representing the bounty's off-chain source (e.g. a Github Issue Id)
    /// @param _issuer The address of the sender of the the mint transaction
    /// @param _organization A UUID representing the bounty's off-chain source (e.g. a Github Organization Id)
    /// @param _claimManager The address of the current ClaimManager. Will be used to initialize onlyClaimManager owned methods in the bounty
    /// @param _depositManager The address of the current DepositManager. Will be used to initialize onlyDepositManager owned methods in the bounty
    /// @param _operation ABI Encoded data to be decoded in the initializer of the bounty, with decode type dependent on bounty type
    /// @return address of the minted bounty
    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization,
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory _operation
    ) external onlyOpenQ returns (address) {
        uint32 operationType = _operation.operationType;

        address beaconProxy;

        if (operationType == OpenQDefinitions.ATOMIC) {
            beaconProxy = atomicBountyBeacon;
        } else if (operationType == OpenQDefinitions.ONGOING) {
            beaconProxy = ongoingBountyBeacon;
        } else if (operationType == OpenQDefinitions.TIERED) {
            beaconProxy = tieredPercentageBountyBeacon;
        } else if (operationType == OpenQDefinitions.TIERED_FIXED) {
            beaconProxy = tieredFixedBountyBeacon;
        } else {
            revert(Errors.UNKNOWN_BOUNTY_TYPE);
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
                _operation
            )
        );

        return address(bounty);
    }
}
