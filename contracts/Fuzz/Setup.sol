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
import './Users.sol';

contract Setup {
    AtomicBountyV1 atomicBounty;
    OngoingBountyV1 ongoingBounty;
    TieredPercentageBountyV1 tieredPercentageBounty;
    TieredFixedBountyV1 tieredFixedBounty;

    event DebugBytes(bytes _bytes);
    event DebugAddress(address _address);
    event DebugUint256(uint256 _uint256);

    OpenQV1 openQ;
    ClaimManagerV1 claimManager;
    DepositManagerV1 depositManager;
    BountyFactory bountyFactory;

    bool bountiesDeployed;

    // Simulated EOAs
    Users owner;
    Users oracle;
    Users minter;

    constructor() {
        // CREATE USER PROXIES (SIMULATES AND EOA)
        owner = new Users();
        oracle = new Users();
        minter = new Users();

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
        bountyFactory = new BountyFactory(
            address(openQ),
            atomicBountyBeacon,
            ongoingBountyBeacon,
            tieredPercentageBountyBeacon,
            tieredFixedBountyBeacon
        );

        // DEPLOY AND INITIALIZE CLAIM MANAGER
        address claimManagerImplementation = address(new ClaimManagerV1());

        address claimManagerProxy = address(
            new OpenQProxy(claimManagerImplementation, new bytes(0))
        );

        claimManager = ClaimManagerV1(claimManagerProxy);
        claimManager.initialize(address(oracle));

        // DEPLOY AND INITIALIZE DEPOSIT MANAGER
        address depositManagerImplementation = address(new DepositManagerV1());

        address depositManagerProxy = address(
            new OpenQProxy(depositManagerImplementation, new bytes(0))
        );

        depositManager = DepositManagerV1(depositManagerProxy);
        depositManager.initialize();

        // DEPLOY OPENQTOKENWHITELIST
        address openQTokenWhiteList = address(new OpenQTokenWhitelist(5));

        openQ.setBountyFactory(address(bountyFactory));
        openQ.setClaimManager(address(claimManager));
        openQ.setDepositManager(address(depositManager));
        openQ.transferOracle(address(oracle));

        depositManager.setTokenWhitelist(openQTokenWhiteList);

        claimManager.setKyc(address(0));
    }

    // make a private setUp method and call if not completed, so this won't be called by fuzzr
    function deployBounties() internal {
        //************************* Mint Atomic Bounty *************************/
        bytes memory initDataAtomic = abi.encode(
            true,
            address(0),
            100,
            true,
            true,
            true,
            '_issuerExternalUserId',
            'alternativeName',
            'alternativeLogo'
        );

        (bool successAtomic, bytes memory resultAtomic) = minter.proxy(
            address(openQ),
            abi.encodeWithSelector(
                openQ.mintBounty.selector,
                'atomicBountyId',
                'atomicOrganization',
                OpenQDefinitions.InitOperation(0, initDataAtomic)
            )
        );
        require(successAtomic);

        address atomicBountyAddress = abi.decode(resultAtomic, (address));
        atomicBounty = AtomicBountyV1(payable(atomicBountyAddress));

        //************************* Mint Ongoing Bounty *************************/
        bytes memory initDataOngoing = abi.encode(
            address(0),
            10,
            true,
            address(0),
            100,
            true,
            true,
            true,
            '_issuerExternalUserId',
            'alternativeName',
            'alternativeLogo'
        );

        (bool successOngoing, bytes memory resultOngoing) = minter.proxy(
            address(openQ),
            abi.encodeWithSelector(
                openQ.mintBounty.selector,
                'OngoingBountyId',
                'OngoingOrganization',
                OpenQDefinitions.InitOperation(1, initDataOngoing)
            )
        );
        require(successOngoing);

        address ongoingBountyAddress = abi.decode(resultOngoing, (address));
        ongoingBounty = OngoingBountyV1(payable(ongoingBountyAddress));

        //************************* Mint Tiered Percentage Bounty *************************/
        bytes memory initDataTieredPercentage = abi.encode(
            [100, 20, 30],
            true,
            address(0),
            1000,
            true,
            true,
            true,
            '_issuerExternalUserId',
            'alternativeName',
            'alternativeLogo'
        );

        (
            bool successTieredPercentage,
            bytes memory resultTieredPercentage
        ) = minter.proxy(
                address(openQ),
                abi.encodeWithSelector(
                    openQ.mintBounty.selector,
                    'TieredBountyId',
                    'TieredOrganization',
                    OpenQDefinitions.InitOperation(2, initDataTieredPercentage)
                )
            );
        require(successTieredPercentage);

        address tieredPercentageBountyAddress = abi.decode(
            resultTieredPercentage,
            (address)
        );
        tieredPercentageBounty = TieredPercentageBountyV1(
            payable(tieredPercentageBountyAddress)
        );

        //************************* Mint Tiered Fixed Bounty *************************/
        bytes memory initDataTieredFixed = abi.encode(
            [20, 10, 2],
            address(0),
            true,
            true,
            true,
            '_issuerExternalUserId',
            'alternativeName',
            'alternativeLogo'
        );

        (bool successTieredFixed, bytes memory resultTieredFixed) = minter
            .proxy(
                address(openQ),
                abi.encodeWithSelector(
                    openQ.mintBounty.selector,
                    'TieredFixedBountyId',
                    'TieredFixedOrganization',
                    OpenQDefinitions.InitOperation(3, initDataTieredFixed)
                )
            );
        require(successTieredFixed);

        address tieredFixedBountyAddress = abi.decode(
            resultTieredFixed,
            (address)
        );
        tieredFixedBounty = TieredFixedBountyV1(
            payable(tieredFixedBountyAddress)
        );

        bountiesDeployed = true;
    }

    // bind _number to [0, UPPER_BOUND) (0 inclusive, UPPER_BOUND exclusive)

    /// @notice Returns a number bound between [0, UPPER_BOUND) (0 inclusive, UPPER_BOUND exclusive) using _number as seed
    /// @dev Useful for scoping input to a certain range, e.g. for bounty types [0, 5)
    /// @param _number the seed coming from some random source
    /// @param UPPER_BOUND the OPEN (up to but not including) upper bound of the range
    /// @return A number between between [0, UPPER_BOUND)
    function bind(uint256 _number, uint256 UPPER_BOUND)
        public
        pure
        returns (uint256)
    {
        return _number % UPPER_BOUND;
    }

    // assert that something never succeeds with assert(!success) on low-level call
}

// no codepath exists which can lower the bounty's balance of ERC20 or protocol tokens EXCEPT claimBounty, permissionClaimTieredBounty, or refundDeposit

// no codepath exists to change bounty.issuer() after being set in the initializer

// no codepath exists EXCEPT for owner that can call the setBountyFactory, setClaimManager, setDepositManager, transferOracle, or upgradeTo on OpenQ
// no codepath exists EXCEPT for owner that can call the setOpenQ, upgradeTo, transferOracle, or setKyc on ClaimManager
// no codepath exists EXCEPT for owner that can call setTokenWhitelist or upgradeTo on DepositManager

// no codepath exists EXCEPT for claimManager that can call claimNft, claimBalance, or close on AtomicBounty
// no codepath exists EXCEPT for claimManager that can call claimNft or claimOngoingPayout on OngoingBounty
// no codepath exists EXCEPT for claimManager that can call claimNft, claimTiered or closeCompetition on TieredPercentageBounty
// no codepath exists EXCEPT for claimManager that can call claimNft, claimTieredFixed or closeCompetition on TieredFixedBounty

// no codepath exists EXCEPT for oracle that can call claimBounty on ClaimManager

// no codepath exists EXCEPT for oracle that can call associateExternalIdToAddress on OpenQ

// no codepath exists EXCEPT for depositManager that can call receiveFunds, refundDeposit or extendDeposit on Bounty
