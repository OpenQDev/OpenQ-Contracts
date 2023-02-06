// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../OpenQ/Implementations/OpenQV1.sol';
import '../OpenQ/Proxy/OpenQProxy.sol';
import '../BountyFactory/BountyFactory.sol';
import '../Library/OpenQDefinitions.sol';
import '../Bounty/Proxy/BountyBeacon.sol';
import '../Bounty/Implementations/AtomicBountyV1.sol';
import '../Bounty/Implementations/OngoingBountyV1.sol';
import '../Bounty/Implementations/TieredPercentageBountyV1.sol';
import '../Bounty/Implementations/TieredFixedBountyV1.sol';
import '../ClaimManager/Implementations/ClaimManagerV1.sol';
import '../DepositManager/Implementations/DepositManagerV1.sol';
import '../TokenWhitelist/OpenQTokenWhitelist.sol';

contract OpenQV1FuzzTest {
    event DebugBytes(bytes _bytes);
    event DebugAddress(address _address);
    event DebugUint256(uint256 _uint256);

    OpenQV1 openQ;
    ClaimManagerV1 claimManager;
    DepositManagerV1 depositManager;

    constructor() {
        // DEPLOY BOUNTY IMPLEMENTATIONS
        address atomicBountyV1 = address(new AtomicBountyV1());
        address ongoingBountyV1 = address(new OngoingBountyV1());
        address tieredPercentageBountyV1 = address(
            new TieredPercentageBountyV1()
        );
        address tieredFixedBountyV1 = address(new TieredFixedBountyV1());

        // DEPLOY BOUNTY BEACONS
        address atomicBountyBeacon = address(new BountyBeacon(atomicBountyV1));
        address ongoingBountyBeacon = address(
            new BountyBeacon(ongoingBountyV1)
        );
        address tieredPercentageBountyBeacon = address(
            new BountyBeacon(tieredPercentageBountyV1)
        );
        address tieredFixedBountyBeacon = address(
            new BountyBeacon(tieredFixedBountyV1)
        );

        // DEPLOY AND INITIALIZE OPENQ IMPLEMENTATION AND PROXY
        address openQImplementation = address(new OpenQV1());

        address openQProxy = address(
            new OpenQProxy(openQImplementation, new bytes(0))
        );

        openQ = OpenQV1(openQProxy);
        openQ.initialize();

        // DEPLOY BOUNTY FACTORY
        address bountyFactory = address(
            new BountyFactory(
                address(openQ),
                atomicBountyBeacon,
                ongoingBountyBeacon,
                tieredPercentageBountyBeacon,
                tieredFixedBountyBeacon
            )
        );

        // DEPLOY AND INITIALIZE CLAIM MANAGER
        address claimManagerImplementation = address(new ClaimManagerV1());

        address claimManagerProxy = address(
            new OpenQProxy(claimManagerImplementation, new bytes(0))
        );

        claimManager = ClaimManagerV1(claimManagerProxy);
        claimManager.initialize(msg.sender);

        // DEPLOY AND INITIALIZE DEPOSIT MANAGER
        address depositManagerImplementation = address(new DepositManagerV1());

        address depositManagerProxy = address(
            new OpenQProxy(depositManagerImplementation, new bytes(0))
        );

        depositManager = DepositManagerV1(depositManagerProxy);
        depositManager.initialize();

        // DEPLOY OPENQTOKENWHITELIST
        address openQTokenWhiteList = address(new OpenQTokenWhitelist(5));

        openQ.setBountyFactory(bountyFactory);
        openQ.setClaimManager(address(claimManager));
        openQ.setDepositManager(address(depositManager));

        depositManager.setTokenWhitelist(openQTokenWhiteList);

        claimManager.setKyc(address(0));
    }

    // Will eventually be called in txn sequence
    function assert_mintBounty_atomic(
        bool _hasFundingGoal,
        address _fundingToken,
        uint256 _fundingGoal,
        bool _invoiceRequired,
        bool _kycRequired,
        bool _supportingDocumentsRequired,
        string memory _issuerExternalUserId,
        string memory _alternativeName,
        string memory _alternativeLogo
    ) public {
        bytes memory initData = abi.encode(
            _hasFundingGoal,
            _fundingToken,
            _fundingGoal,
            _invoiceRequired,
            _kycRequired,
            _supportingDocumentsRequired,
            _issuerExternalUserId,
            _alternativeName,
            _alternativeLogo
        );

        address bountyAddress = openQ.mintBounty(
            '_bountyId',
            '_organization',
            OpenQDefinitions.InitOperation(0, initData)
        );

        AtomicBountyV1 atomicBounty = AtomicBountyV1(payable(bountyAddress));

        emit DebugAddress(bountyAddress);
        emit DebugUint256(atomicBounty.bountyType());

        assert(bountyAddress != address(0x0));
    }

    function assert_test() public {
        // Pre-condition
        // Optimization: modular arithmetic
        // State before action
        // Action
        // Post-condition

        // Use try/catch if you believe that no non-happy path exists, i.e. reverts are impossible
        try {
            // Action
            // Post-condition
        } catch (bytes memory err) {
            assert(false);
        }
    }

    // bind _number to [0, UPPER_BOUND) (0 inclusive, UPPER_BOUND exclusive)
    function bind(uint256 _number, uint256 UPPER_BOUND)
        public
        pure
        returns (uint256)
    {
        return _number % UPPER_BOUND;
    }
}
