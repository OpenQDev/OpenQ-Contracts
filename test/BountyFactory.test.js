/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");

const { 
	Constants, 
	atomicBountyInitOperation_fundingGoal, 
	atomicBountyInitOperation_noFundingGoal, 
	atomicBountyInitOperation_permissioned,
	ongoingBountyInitOperationBuilder,
	tieredBountyInitOperationBuilder,
	tieredFixedBountyInitOperationBuilder,
	tieredBountyInitOperation_not100
} = require('./constants');

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

	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredPercentageBountyInitOperation;
	let tieredFixedBountyInitOperation;

	const mockOpenQId = "mockOpenQId"
	const mockId = "mockId";
	const organization = "mockOrganization";

	beforeEach(async () => {
		OpenQImplementation = await hre.ethers.getContractFactory('OpenQV1');
		OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		BountyFactory = await hre.ethers.getContractFactory('BountyFactory');
		BountyBeacon = await hre.ethers.getContractFactory('BountyBeacon');
		
		AtomicBountyV1 = await hre.ethers.getContractFactory('AtomicBountyV1');
		OngoingBountyV1 = await hre.ethers.getContractFactory('OngoingBountyV1');
		TieredPercentageBountyV1 = await hre.ethers.getContractFactory('TieredPercentageBountyV1');
		TieredFixedBountyV1 = await hre.ethers.getContractFactory('TieredFixedBountyV1');

		[owner, oracle, notOpenQ, claimManager, depositManager] = await ethers.getSigners();

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		// Deploy OpenQV1 Implementation
		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		// BOUNTY IMPLEMENTATIONS
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
		
		// INIT DATA
		const abiCoder = new ethers.utils.AbiCoder;

		atomicBountyInitOperation = atomicBountyInitOperation_fundingGoal(mockLink.address)
		ongoingBountyInitOperation = ongoingBountyInitOperationBuilder(mockLink.address)
		tieredPercentageBountyInitOperation = tieredBountyInitOperationBuilder(mockLink.address)
		tieredFixedBountyInitOperation = tieredFixedBountyInitOperationBuilder(mockLink.address)
	});

	describe('constructor', () => {
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
			await expect(bountyFactory.mintBounty(mockOpenQId, owner.address, organization, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('Method is only callable by OpenQ');
		});
	});

	describe('mintBounty', () => {
		it('should mint a bounty with expected data - ATOMIC', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(
				owner.address,
				atomicBountyBeacon.address,
				ongoingBountyBeacon.address,
				tieredPercentageBountyBeacon.address,
				tieredFixedBountyBeacon.address
				);
			await newBountyFactory.deployed();

			let initializationTimestamp = await setNextBlockTimestamp();

			const txn = await newBountyFactory.mintBounty(
				mockId,
				owner.address,
				organization,
				claimManager.address,
				depositManager.address,
				atomicBountyInitOperation
			);

			const receipt = await txn.wait();

			const atomicContract = await AtomicBountyV1.attach(receipt.events[0].address);

			await expect(await atomicContract.bountyId()).equals(mockId);
			await expect(await atomicContract.issuer()).equals(owner.address);
			await expect(await atomicContract.organization()).equals(organization);
			await expect(await atomicContract.status()).equals(0);
			await expect(await atomicContract.openQ()).equals(owner.address);
			await expect(await atomicContract.claimManager()).equals(claimManager.address);
			await expect(await atomicContract.depositManager()).equals(depositManager.address);
			await expect(await atomicContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await atomicContract.bountyType()).equals(Constants.ATOMIC_CONTRACT);
			await expect(await atomicContract.hasFundingGoal()).equals(true);
			await expect(await atomicContract.fundingToken()).equals(mockLink.address);
			await expect(await atomicContract.fundingGoal()).equals(Constants.volume);
			await expect(await atomicContract.issuerExternalUserId()).equals(mockOpenQId);

			await expect(await atomicContract.invoiceRequired()).equals(false);
			await expect(await atomicContract.kycRequired()).equals(false);
			await expect(await atomicContract.supportingDocumentsRequired()).equals(false);

			await expect(atomicContract.initialize(mockOpenQId, owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('Initializable: contract is already initialized');
		});

		it('should mint a bounty with expected data - ONGOING', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(
				owner.address,
				atomicBountyBeacon.address,
				ongoingBountyBeacon.address,
				tieredPercentageBountyBeacon.address,
				tieredFixedBountyBeacon.address
				);
			await newBountyFactory.deployed();

			let initializationTimestamp = await setNextBlockTimestamp();

			const txn = await newBountyFactory.mintBounty(
				mockId,
				owner.address,
				organization,
				claimManager.address,
				depositManager.address,
				ongoingBountyInitOperation
			);

			const receipt = await txn.wait();

			const ongoingContract = await OngoingBountyV1.attach(receipt.events[0].address);

			await expect(await ongoingContract.bountyId()).equals(mockId);
			await expect(await ongoingContract.issuer()).equals(owner.address);
			await expect(await ongoingContract.organization()).equals(organization);
			await expect(await ongoingContract.status()).equals(0);
			await expect(await ongoingContract.openQ()).equals(owner.address);
			await expect(await ongoingContract.claimManager()).equals(claimManager.address);
			await expect(await ongoingContract.depositManager()).equals(depositManager.address);
			await expect(await ongoingContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await ongoingContract.bountyType()).equals(Constants.ONGOING_CONTRACT);
			await expect(await ongoingContract.hasFundingGoal()).equals(true);
			await expect(await ongoingContract.fundingToken()).equals(mockLink.address);
			await expect(await ongoingContract.fundingGoal()).equals(Constants.volume);
			await expect(await ongoingContract.issuerExternalUserId()).equals(mockOpenQId);

			await expect(await ongoingContract.invoiceRequired()).equals(false);
			await expect(await ongoingContract.kycRequired()).equals(false);
			await expect(await ongoingContract.supportingDocumentsRequired()).equals(false);

			await expect(ongoingContract.initialize('mock-id', owner.address, 'mock-organization', owner.address, claimManager.address, depositManager.address, ongoingBountyInitOperation)).to.be.revertedWith('Initializable: contract is already initialized');
		});

		it('should mint a bounty with expected data - TIERED PERCENTAGE', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(
				owner.address,
				atomicBountyBeacon.address,
				ongoingBountyBeacon.address,
				tieredPercentageBountyBeacon.address,
				tieredFixedBountyBeacon.address
				);
			await newBountyFactory.deployed();

			let initializationTimestamp = await setNextBlockTimestamp();

			const txn = await newBountyFactory.mintBounty(
				mockId,
				owner.address,
				organization,
				claimManager.address,
				depositManager.address,
				tieredPercentageBountyInitOperation
			);

			const receipt = await txn.wait();

			const tieredPercentageContract = await TieredPercentageBountyV1.attach(receipt.events[0].address);

			const actualBountyPayoutSchedule = await tieredPercentageContract.getPayoutSchedule();
			const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

			await expect(await tieredPercentageContract.bountyId()).equals(mockId);
			await expect(await tieredPercentageContract.bountyId()).equals(mockId);
			await expect(await tieredPercentageContract.issuer()).equals(owner.address);
			await expect(await tieredPercentageContract.organization()).equals(organization);
			await expect(await tieredPercentageContract.status()).equals(0);
			await expect(await tieredPercentageContract.openQ()).equals(owner.address);
			await expect(await tieredPercentageContract.claimManager()).equals(claimManager.address);
			await expect(await tieredPercentageContract.depositManager()).equals(depositManager.address);
			await expect(await tieredPercentageContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await tieredPercentageContract.bountyType()).equals(Constants.TIERED_PERCENTAGE_CONTRACT);
			await expect(await tieredPercentageContract.hasFundingGoal()).equals(true);
			await expect(await tieredPercentageContract.fundingToken()).equals(mockLink.address);
			await expect(await tieredPercentageContract.fundingGoal()).equals(Constants.volume);
			await expect(payoutToString[0]).equals("60");
			await expect(payoutToString[1]).equals("30");
			await expect(await tieredPercentageContract.invoiceRequired()).equals(true);
			await expect(await tieredPercentageContract.kycRequired()).equals(true);
			await expect(await tieredPercentageContract.issuerExternalUserId()).equals(mockOpenQId);
			
			await expect(await tieredPercentageContract.supportingDocumentsRequired()).equals(true);
			await expect(await tieredPercentageContract.invoiceComplete(0)).equals(false);
			await expect(await tieredPercentageContract.supportingDocumentsComplete(0)).equals(false);

			await expect(tieredPercentageContract.initialize(mockOpenQId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredPercentageBountyInitOperation)).to.be.revertedWith('Initializable: contract is already initialized');
		});

		it('should mint a bounty with expected data - TIERED FIXED', async () => {
			// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
			let newBountyFactory = await BountyFactory.deploy(
				owner.address,
				atomicBountyBeacon.address,
				ongoingBountyBeacon.address,
				tieredPercentageBountyBeacon.address,
				tieredFixedBountyBeacon.address
				);
			await newBountyFactory.deployed();

			let initializationTimestamp = await setNextBlockTimestamp();

			const txn = await newBountyFactory.mintBounty(
				mockId,
				owner.address,
				organization,
				claimManager.address,
				depositManager.address,
				tieredFixedBountyInitOperation
			);

			const receipt = await txn.wait();

			const tieredFixedContract = await TieredFixedBountyV1.attach(receipt.events[0].address);

			const actualBountyPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

			await expect(await tieredFixedContract.bountyId()).equals(mockId);
			await expect(await tieredFixedContract.issuer()).equals(owner.address);
			await expect(await tieredFixedContract.organization()).equals(organization);
			await expect(await tieredFixedContract.status()).equals(0);
			await expect(await tieredFixedContract.openQ()).equals(owner.address);
			await expect(await tieredFixedContract.claimManager()).equals(claimManager.address);
			await expect(await tieredFixedContract.depositManager()).equals(depositManager.address);
			await expect(await tieredFixedContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await tieredFixedContract.bountyType()).equals(Constants.TIERED_FIXED_CONTRACT);
			await expect(await tieredFixedContract.payoutTokenAddress()).equals(mockLink.address);
			await expect(payoutToString[0]).equals("80");
			await expect(payoutToString[1]).equals("20");
			await expect(await tieredFixedContract.invoiceRequired()).equals(true);
			await expect(await tieredFixedContract.kycRequired()).equals(true);
			await expect(await tieredFixedContract.issuerExternalUserId()).equals(mockOpenQId);
			await expect(await tieredFixedContract.supportingDocumentsRequired()).equals(true);

			await expect(await tieredFixedContract.invoiceComplete(0)).equals(false);
			await expect(await tieredFixedContract.supportingDocumentsComplete(0)).equals(false);

			await expect(tieredFixedContract.initialize(mockOpenQId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation)).to.be.revertedWith('Initializable: contract is already initialized');
		});

		it('should revert for unknown bounty type', async () => {
						// Must redeploy and pretend that owner account is OpenQ in order to call BountyFactory.mintBounty
						let newBountyFactory = await BountyFactory.deploy(
							owner.address,
							atomicBountyBeacon.address,
							ongoingBountyBeacon.address,
							tieredPercentageBountyBeacon.address,
							tieredFixedBountyBeacon.address
							);
						await newBountyFactory.deployed();
			
						const abiCoder = new ethers.utils.AbiCoder;
						const abiEncodedParamsTieredFixedBounty = abiCoder.encode(['uint256[]', 'address', 'bool', 'bool', 'bool', 'string', 'string', 'string'], [[80, 20], mockLink.address, true, true, true, Constants.mockOpenQId, "", ""]);
						tieredFixedBountyInitOperation_UnknownBountyType = [42, abiEncodedParamsTieredFixedBounty];
						let initializationTimestamp = await setNextBlockTimestamp();
			
						expect(newBountyFactory.mintBounty(
							mockId,
							owner.address,
							organization,
							claimManager.address,
							depositManager.address,
							tieredFixedBountyInitOperation_UnknownBountyType
						)).to.be.revertedWith('UNKNOWN_BOUNTY_TYPE')
		})
	});
});

async function setNextBlockTimestamp() {
	return new Promise(async (resolve,) => {
		const blockNumBefore = await ethers.provider.getBlockNumber();
		const blockBefore = await ethers.provider.getBlock(blockNumBefore);
		const timestampBefore = blockBefore.timestamp;
		const expectedTimestamp = timestampBefore + 10;
		await network.provider.send("evm_setNextBlockTimestamp", [expectedTimestamp]);
		resolve(expectedTimestamp);
	});
}