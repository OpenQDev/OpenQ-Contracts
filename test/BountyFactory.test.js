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

	let BountyV1;
	let BountyBeacon;
	let BountyFactory;

	let oracle;
	let owner;
	let notOpenQ;

	let bountyInitOperations;
	let initOperations;

	beforeEach(async () => {
		OpenQImplementation = await hre.ethers.getContractFactory('OpenQV1');
		OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		BountyFactory = await hre.ethers.getContractFactory('BountyFactory');
		BountyBeacon = await hre.ethers.getContractFactory('BountyBeacon');
		BountyV1 = await hre.ethers.getContractFactory('BountyV1');

		[owner, oracle, notOpenQ] = await ethers.getSigners();

		// Deploy OpenQV1 Implementation
		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		// Deploy BountyV1 Implementation
		bountyV1 = await BountyV1.deploy();
		await bountyV1.deployed();

		bountyBeacon = await BountyBeacon.deploy(bountyV1.address);
		await bountyBeacon.deployed();

		// Deploy OpenQProxy with the previously deployed OpenQV1 implementation's address
		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		// Initialize the OpenQProxy
		await openQProxy.initialize(oracle.address);

		// Deploy BountyFactory
		bountyFactory = await BountyFactory.deploy(openQProxy.address, bountyBeacon.address);
		await bountyFactory.deployed();

		bountyInitOperations = [
			[
				0,
				[]
			]
		];

		const abiCoder = new ethers.utils.AbiCoder;
		const abiEncodedParams = abiCoder.encode(["address", "uint256"], [notOpenQ.address, 100]);

		initOperations = [
			[
				1,
				abiEncodedParams
			]
		];
	});

	describe('constructor', () => {
		it('should initiatlize with correct OpenQ proxy address and BountyBeacon address', async () => {
			expect(await bountyFactory.openQ()).equals(openQProxy.address);
			expect(await bountyFactory.getBeacon()).equals(bountyBeacon.address);
		});
	});

	describe('Access Controls', () => {
		it('should revert if called directly, not through OpenQProxy', async () => {
			await expect(bountyFactory.mintBounty('mock-id', owner.address, 'mock-organization', initOperations)).to.be.revertedWith('Method is only callable by OpenQ');
		});
	});

	describe('mintBounty', () => {
		it('should mint a bounty with expected data', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(owner.address, bountyBeacon.address);
			await newBountyFactory.deployed();

			const txn = await newBountyFactory.mintBounty(
				'mock-id',
				owner.address,
				'mock-organization',
				initOperations
			);

			const receipt = await txn.wait();

			const newBounty = await BountyV1.attach(receipt.events[0].address);

			const bountyId = await newBounty.bountyId();
			const organization = await newBounty.organization();
			const openQAddress = await newBounty.openQ();
			const ongoing = await newBounty.ongoing();
			const payoutVolume = await newBounty.payoutVolume();
			const payoutTokenAddress = await newBounty.payoutTokenAddress();

			expect(bountyId).to.equal('mock-id');
			expect(organization).to.equal('mock-organization');
			expect(openQAddress).to.equal(owner.address);
			expect(ongoing).to.equal(true);
			expect(payoutVolume).to.equal('100');
			expect(payoutTokenAddress).to.equal(notOpenQ.address);

			await expect(newBounty.initialize('mock-id', owner.address, 'mock-organization', owner.address, bountyInitOperations)).to.be.revertedWith('Initializable: contract is already initialized');
		});
	});
});