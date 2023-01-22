/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");

describe.only('BountyFactory', () => {
	let openQImplementation;
	let openQProxy;
	let bountyFactory;

	let randomContractUpgradeAddress;

	let OpenQImplementation;
	let OpenQProxy;

	let AtomicBountyV1;
	let OngoingBountyV1;
	let TieredPercentageBountyV1;
	let TieredFixedBountyV1;

	let BountyBeacon;
	let BountyFactory;

	let oracle;
	let owner;
	let notOpenQ;
	let claimManager;
	let depositManager;

	let bountyInitOperation;
	let initOperation;

	const mockOpenQId = "mockOpenQId"

	beforeEach(async () => {
		OpenQImplementation = await hre.ethers.getContractFactory('OpenQV1');
		OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		BountyFactory = await hre.ethers.getContractFactory('BountyFactory');
		BountyBeacon = await hre.ethers.getContractFactory('BountyBeacon');
		
		AtomicBountyV1 = await hre.ethers.getContractFactory('AtomicBountyV1');
		OngoingBountyV1 = await hre.ethers.getContractFactory('OngoingBountyV1');
		TieredPercentageBountyV1 = await hre.ethers.getContractFactory('TieredPercentageBountyV1');
		TieredFixedBountyV1 = await hre.ethers.getContractFactory('TieredFixedBountyV1');

		[owner, oracle, notOpenQ, claimManager, depositManager] = await ethers.getSigners();

		// Deploy OpenQV1 Implementation
		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		// BOUNTY IMPLEMENTATION
		atomicBountyV1 = await AtomicBountyV1.deploy();
		await atomicBountyV1.deployed();
		
		ongoingBountyV1 = await OngoingBountyV1.deploy();
		await ongoingBountyV1.deployed();
		
		tieredPercentageBountyV1 = await TieredPercentageBountyV1.deploy();
		await tieredPercentageBountyV1.deployed();
		
		tieredFixedBountyV1 = await TieredFixedBountyV1.deploy();
		await tieredFixedBountyV1.deployed();

		// BOUNTY BEACONS
		atomicBountyBeacon = await BountyBeacon.deploy(atomicBountyV1.address);
		await atomicBountyBeacon.deployed();

		ongoingBountyBeacon = await BountyBeacon.deploy(ongoingBountyV1.address);
		await ongoingBountyBeacon.deployed();

		tieredPercentageBountyBeacon = await BountyBeacon.deploy(tieredPercentageBountyV1.address);
		await tieredPercentageBountyBeacon.deployed();

		tieredFixedBountyBeacon = await BountyBeacon.deploy(tieredFixedBountyV1.address);
		await tieredFixedBountyBeacon.deployed();

		// Deploy OpenQProxy with the previously deployed OpenQV1 implementation's address
		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		// Initialize the OpenQProxy
		await openQProxy.initialize();

		// Deploy BountyFactory
		bountyFactory = await BountyFactory.deploy(
			openQProxy.address,
			atomicBountyBeacon.address,
			ongoingBountyBeacon.address,
			tieredPercentageBountyBeacon.address,
			tieredFixedBountyBeacon.address
			);
		await bountyFactory.deployed();

		bountyInitOperation = [0, []];

		const abiCoder = new ethers.utils.AbiCoder;
		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [notOpenQ.address, 100, true, notOpenQ.address, 100, true, true, true, mockOpenQId, "", ""]);

		initOperation = [1, abiEncodedParams];
	});

	describe.only('constructor', () => {
		it('should initiatlize with correct OpenQ proxy address and BountyBeacon address', async () => {
			expect(await bountyFactory.openQ()).equals(openQProxy.address);
			expect(await bountyFactory.atomicBountyBeacon()).equals(atomicBountyBeacon.address);
			expect(await bountyFactory.ongoingBountyBeacon()).equals(ongoingBountyBeacon.address);
			expect(await bountyFactory.tieredPercentageBountyBeacon()).equals(tieredPercentageBountyBeacon.address);
			expect(await bountyFactory.tieredFixedBountyBeacon()).equals(tieredFixedBountyBeacon.address);
		});
	});

	describe('Access Controls', () => {
		it('should revert if called directly, not through OpenQProxy', async () => {
			await expect(bountyFactory.mintBounty('mock-id', owner.address, 'mock-organization', claimManager.address, depositManager.address, initOperation)).to.be.revertedWith('Method is only callable by OpenQ');
		});
	});

	describe('mintBounty', () => {
		it('should mint a bounty with expected data', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(owner.address, atomicBountyBeacon.address);
			await newBountyFactory.deployed();

			const txn = await newBountyFactory.mintBounty(
				'mock-id',
				owner.address,
				'mock-organization',
				claimManager.address,
				depositManager.address,
				initOperation
			);

			const receipt = await txn.wait();

			const newBounty = await AtomicBountyV1.attach(receipt.events[0].address);

			expect(await newBounty.bountyId()).to.equal('mock-id');
			expect(await newBounty.bountyType()).to.equal(1);
			expect(await newBounty.organization()).to.equal('mock-organization');
			expect(await newBounty.openQ()).to.equal(owner.address);
			expect(await newBounty.payoutTokenAddress()).to.equal(notOpenQ.address);
			expect(await newBounty.payoutVolume()).to.equal(100);
			expect(await newBounty.claimManager()).to.equal(claimManager.address);
			expect(await newBounty.depositManager()).to.equal(depositManager.address);

			await expect(newBounty.initialize('mock-id', owner.address, 'mock-organization', owner.address, claimManager.address, depositManager.address, bountyInitOperation)).to.be.revertedWith('Initializable: contract is already initialized');
		});
	});
});