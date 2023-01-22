/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');
const Constants = require('./constants');

describe.only('OpenQ.sol', () => {
	// MOCK ASSETS
	let openQProxy;
	let openQImplementation;
	let mockLink;
	let mockDai;
	let blacklistedMockDai;
	let mockNft;
	let openQTokenWhitelist;
	let depositManager;
	let claimManager;

	// ACCOUNTS
	let owner;
	let oracle;
	let claimant;
	let notIssuer;

	// CONSTANTS
	const mockOpenQId = "mockOpenQId"
	const mockId = "mockId";
	const bountyId = "bountyId";
	const organization = "mockOrganization";
	let mockFunderUuid = 'mock-funder-uuid';

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredBountyInitOperation;
	let tieredBountyInitOperationNot100;
	let tieredFixedBountyInitOperation;

	// CLOSER DATA
	let abiCoder;

	let abiEncodedSingleCloserData;
	let abiEncodedOngoingCloserData;
	let abiEncodedTieredCloserData;
	let abiEncodedTieredFixedCloserData;

	let AtomicBountyV1
	let OngoingBountyV1
	let TieredPercentageBountyV1
	let TieredFixedBountyV1

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManagerV1');
		const ClaimManager = await ethers.getContractFactory('ClaimManagerV1');

		AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
		OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
		TieredPercentageBountyV1 = await ethers.getContractFactory('TieredPercentageBountyV1');
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');

		// BOUNTY IMPLEMENTATIONS
		atomicBountyV1 = await AtomicBountyV1.deploy();
		await atomicBountyV1.deployed();
		
		ongoingBountyV1 = await OngoingBountyV1.deploy();
		await ongoingBountyV1.deployed();
		
		tieredPercentageBountyV1 = await TieredPercentageBountyV1.deploy();
		await tieredPercentageBountyV1.deployed();
		
		tieredFixedBountyV1 = await TieredFixedBountyV1.deploy();
		await tieredFixedBountyV1.deployed();

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');

		[owner, claimant, oracle, claimantSecondPlace, notIssuer] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize();

		let depositManagerImplementation = await DepositManager.deploy();
		await depositManagerImplementation.deployed();
		const DepositManagerProxy = await ethers.getContractFactory('OpenQProxy');
		let depositManagerProxy = await DepositManagerProxy.deploy(depositManagerImplementation.address, []);
		await depositManagerProxy.deployed();
		depositManager = await DepositManager.attach(depositManagerProxy.address);
		await depositManager.initialize();

		claimManagerImplementation = await ClaimManager.deploy();
		await claimManagerImplementation.deployed();
		const ClaimManagerProxy = await ethers.getContractFactory('OpenQProxy');
		let claimManagerProxy = await ClaimManagerProxy.deploy(claimManagerImplementation.address, []);
		await claimManagerProxy.deployed();
		claimManager = await ClaimManager.attach(claimManagerProxy.address);
		await claimManager.initialize(oracle.address);

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		blacklistedMockDai = await MockDai.deploy();
		await blacklistedMockDai.deployed();

		mockNft = await MockNft.deploy();
		await mockNft.deployed();

		openQTokenWhitelist = await OpenQTokenWhitelist.deploy(5);
		await openQTokenWhitelist.deployed();

		await openQTokenWhitelist.addToken(mockLink.address);
		await openQTokenWhitelist.addToken(mockDai.address);
		await openQTokenWhitelist.addToken(ethers.constants.AddressZero);
		await openQTokenWhitelist.addToken(mockNft.address);

		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);

		// BOUNTY BEACONS
		atomicBountyBeacon = await BountyBeacon.deploy(atomicBountyV1.address);
		await atomicBountyBeacon.deployed();

		ongoingBountyBeacon = await BountyBeacon.deploy(ongoingBountyV1.address);
		await ongoingBountyBeacon.deployed();

		tieredPercentageBountyBeacon = await BountyBeacon.deploy(tieredPercentageBountyV1.address);
		await tieredPercentageBountyBeacon.deployed();

		tieredFixedBountyBeacon = await BountyBeacon.deploy(tieredFixedBountyV1.address);
		await tieredFixedBountyBeacon.deployed();

		// BOUNTY FACTORY
		bountyFactory = await BountyFactory.deploy(
			openQProxy.address,
			atomicBountyBeacon.address,
			ongoingBountyBeacon.address,
			tieredPercentageBountyBeacon.address,
			tieredFixedBountyBeacon.address
			);
		await bountyFactory.deployed();

		await openQProxy.setBountyFactory(bountyFactory.address);
		await openQProxy.transferOracle(oracle.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;

		const atomicBountyAbiEncodedParams = abiCoder.encode(["bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		atomicBountyInitOperation = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [mockLink.address, '100', true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		ongoingBountyInitOperation = [Constants.ONGOING_CONTRACT, abiEncodedParams];

		const tieredAbiEncodedParams = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[60, 30, 10], true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		tieredBountyInitOperation = [Constants.TIERED_PERCENTAGE_CONTRACT, tieredAbiEncodedParams];

		const tieredAbiEncodedParamsNot100 = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[60, 30, 10, 90], true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		tieredBountyInitOperationNot100 = [Constants.TIERED_PERCENTAGE_CONTRACT, tieredAbiEncodedParamsNot100];

		const abiEncodedParamsTieredFixedBounty = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[80, 20], true, mockLink.address, '100', true, true, true, mockOpenQId, "", ""]);
		tieredFixedBountyInitOperation = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredFixedCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
	});

	describe('initialization', () => {
		it('should initialize with correct fields', async () => {
			expect(await openQProxy.owner()).equals('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
		});

		it('should only be initialized once', async () => {
			await expect(openQProxy.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
		});
	});

	describe('mintBounty', () => {
		describe('ATOMIC', () => {
			it('should deploy a new bounty contract with expected initial metadata', async () => {

				// ACT
				let initializationTimestamp = await setNextBlockTimestamp();
				await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const atomicContract = await AtomicBountyV1.attach(
					bountyAddress
				);

				await expect(await atomicContract.bountyId()).equals(bountyId);
				await expect(await atomicContract.issuer()).equals(owner.address);
				await expect(await atomicContract.organization()).equals(organization);
				await expect(await atomicContract.status()).equals(0);
				await expect(await atomicContract.openQ()).equals(openQProxy.address);
				await expect(await atomicContract.claimManager()).equals(claimManager.address);
				await expect(await atomicContract.depositManager()).equals(depositManager.address);
				await expect(await atomicContract.bountyCreatedTime()).equals(initializationTimestamp);
				await expect(await atomicContract.bountyType()).equals(Constants.ATOMIC_CONTRACT);
				await expect(await atomicContract.hasFundingGoal()).equals(true);
				await expect(await atomicContract.fundingToken()).equals(mockLink.address);
				await expect(await atomicContract.fundingGoal()).equals(1000);
				await expect(await atomicContract.invoiceable()).equals(true);
				await expect(await atomicContract.kycRequired()).equals(true);
				await expect(await atomicContract.externalUserId()).equals(mockOpenQId);
				await expect(await atomicContract.supportingDocuments()).equals(true);
			});

			it('should revert if bounty already exists', async () => {
				// ARRANGE
				// ACT
				await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);

				// ASSERT
				await expect(openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation)).to.be.revertedWith('BOUNTY_ALREADY_EXISTS');
			});

			it('should store bountyId to bountyAddress', async () => {
				// ACT
				await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const atomicContract = await AtomicBountyV1.attach(
					bountyAddress
				);

				const bountyIdFromAddress = await openQProxy.bountyAddressToBountyId(bountyAddress);
				expect(bountyIdFromAddress).to.equal(bountyId);

				const bountyAddressFromId = await openQProxy.bountyIdToAddress(bountyId);
				expect(bountyAddressFromId).to.equal(bountyAddress);
			});

			it('should emit a BountyCreated event with expected bounty id, issuer address, bounty address, bountyMintTime, bountyType, and data', async () => {
				// ARRANGE
				const expectedBountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				let expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT

				// SINGLE
				let txnSingle;
				await expect(txnSingle = await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation))
					.to.emit(openQProxy, 'BountyCreated')
					.withArgs(bountyId, organization, owner.address, anyValue, expectedTimestamp, 0, [], Constants.VERSION_1);
				txnReceipt = await txnSingle.wait(); // 0ms, as tx is already confirmed
				event = txnReceipt.events.find(event => event.event === 'BountyCreated');
				[bountyAddress] = event.args;
				expect(bountyAddress).to.not.equal(ethers.constants.AddressZero);
			});
		});

		describe('ONGOING', () => {
			it('should deploy a new bounty contract with expected initial metadata', async () => {

				// ACT
				let initializationTimestamp = await setNextBlockTimestamp();
				await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const ongoingContract = await OngoingBountyV1.attach(
					bountyAddress
				);

				await expect(await ongoingContract.bountyId()).equals(bountyId);
				await expect(await ongoingContract.issuer()).equals(owner.address);
				await expect(await ongoingContract.organization()).equals(organization);
				await expect(await ongoingContract.status()).equals(0);
				await expect(await ongoingContract.openQ()).equals(openQProxy.address);
				await expect(await ongoingContract.claimManager()).equals(claimManager.address);
				await expect(await ongoingContract.depositManager()).equals(depositManager.address);
				await expect(await ongoingContract.bountyCreatedTime()).equals(initializationTimestamp);
				await expect(await ongoingContract.bountyType()).equals(Constants.ONGOING_CONTRACT);
				await expect(await ongoingContract.hasFundingGoal()).equals(true);
				await expect(await ongoingContract.fundingToken()).equals(mockLink.address);
				await expect(await ongoingContract.payoutTokenAddress()).equals(mockLink.address);
				await expect(await ongoingContract.payoutVolume()).equals(100);
				await expect(await ongoingContract.fundingGoal()).equals(1000);
				await expect(await ongoingContract.invoiceable()).equals(true);
				await expect(await ongoingContract.kycRequired()).equals(true);
				await expect(await ongoingContract.externalUserId()).equals(mockOpenQId);
				await expect(await ongoingContract.supportingDocuments()).equals(true);
			});
		});

		describe('TIERED', () => {
			it('should correctly init bountyType and payout schedule', async () => {
				// ARRANGE
				let initializationTimestamp = await setNextBlockTimestamp();

				// ACT
				await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const tieredPercentageContract = await TieredPercentageBountyV1.attach(
					bountyAddress
				);

				const actualBountyPayoutSchedule = await tieredPercentageContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());
	
				await expect(await tieredPercentageContract.bountyId()).equals(bountyId);
				await expect(await tieredPercentageContract.issuer()).equals(owner.address);
				await expect(await tieredPercentageContract.organization()).equals(organization);
				await expect(await tieredPercentageContract.status()).equals(0);
				await expect(await tieredPercentageContract.openQ()).equals(openQProxy.address);
				await expect(await tieredPercentageContract.claimManager()).equals(claimManager.address);
				await expect(await tieredPercentageContract.depositManager()).equals(depositManager.address);
				await expect(await tieredPercentageContract.bountyCreatedTime()).equals(initializationTimestamp);
				await expect(await tieredPercentageContract.bountyType()).equals(Constants.TIERED_PERCENTAGE_CONTRACT);
				await expect(await tieredPercentageContract.hasFundingGoal()).equals(true);
				await expect(await tieredPercentageContract.fundingToken()).equals(mockLink.address);
				await expect(await tieredPercentageContract.fundingGoal()).equals(1000);
				await expect(payoutToString[0]).equals("60");
				await expect(payoutToString[1]).equals("30");
				await expect(await tieredPercentageContract.invoiceable()).equals(true);
				await expect(await tieredPercentageContract.kycRequired()).equals(true);
				await expect(await tieredPercentageContract.externalUserId()).equals(mockOpenQId);
				await expect(await tieredPercentageContract.supportingDocuments()).equals(true);
	
				await expect(await tieredPercentageContract.invoiceComplete(0)).equals(false);
				await expect(await tieredPercentageContract.supportingDocumentsComplete(0)).equals(false);
			});

			it('should revert if payout schedule does not add to 100', async () => {
				await expect(openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperationNot100)).to.be.revertedWith('PAYOUT_SCHEDULE_MUST_ADD_TO_100');
			});
		});

		describe('TIERED FIXED', () => {
			it('should correctly init bountyType and payout schedule', async () => {
				// ARRANGE
				let initializationTimestamp = await setNextBlockTimestamp();

				// ACT
				await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const tieredFixedContract = await TieredFixedBountyV1.attach(
					bountyAddress
				);

				const actualBountyPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());
	
				await expect(await tieredFixedContract.bountyId()).equals(bountyId);
				await expect(await tieredFixedContract.issuer()).equals(owner.address);
				await expect(await tieredFixedContract.organization()).equals(organization);
				await expect(await tieredFixedContract.status()).equals(0);
				await expect(await tieredFixedContract.openQ()).equals(openQProxy.address);
				await expect(await tieredFixedContract.claimManager()).equals(claimManager.address);
				await expect(await tieredFixedContract.depositManager()).equals(depositManager.address);
				await expect(await tieredFixedContract.bountyCreatedTime()).equals(initializationTimestamp);
				await expect(await tieredFixedContract.bountyType()).equals(Constants.TIERED_FIXED_CONTRACT);
				await expect(await tieredFixedContract.hasFundingGoal()).equals(true);
				await expect(await tieredFixedContract.fundingToken()).equals(mockLink.address);
				await expect(await tieredFixedContract.fundingGoal()).equals(100);
				await expect(payoutToString[0]).equals("80");
				await expect(payoutToString[1]).equals("20");
				await expect(await tieredFixedContract.invoiceable()).equals(true);
				await expect(await tieredFixedContract.kycRequired()).equals(true);
				await expect(await tieredFixedContract.externalUserId()).equals(mockOpenQId);
				await expect(await tieredFixedContract.supportingDocuments()).equals(true);
	
				await expect(await tieredFixedContract.invoiceComplete(0)).equals(false);
				await expect(await tieredFixedContract.supportingDocumentsComplete(0)).equals(false);
			});
		});
	});

	describe('solvent', () => {
		it('should return TRUE for solvent ongoing contracts', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, mockFunderUuid);

			const solvent = await openQProxy.solvent(bountyId);
			expect(solvent).to.equal(true);
		});

		it('should return FALSE for insolvent ongoing contracts', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			const solvent = await openQProxy.solvent(bountyId);
			expect(solvent).to.equal(false);
		});
	});

	describe('closeOngoing', () => {
		it('should close ongoing', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ACT
			await openQProxy.closeOngoing(bountyId);

			// ASSERT
			status = await bounty.status();
			expect(status).to.equal(1);
		});

		it('should revert if not ongoing', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ASSERT
			await expect(openQProxy.closeOngoing(bountyId)).to.be.revertedWith('NOT_AN_ONGOING_CONTRACT');
		});

		it('should revert if already closed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);
			await openQProxy.closeOngoing(bountyId);

			// ASSERT
			await expect(openQProxy.closeOngoing(bountyId)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should revert if caller not issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ASSERT
			await expect(openQProxy.connect(notIssuer).closeOngoing(bountyId)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});

		it('should emit BountyClosed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			const expectedTimestamp = await setNextBlockTimestamp();
			// ACT
			await expect(openQProxy.closeOngoing(bountyId))
				.to.emit(openQProxy, 'BountyClosed')
				.withArgs(bountyId, anyValue, organization, ethers.constants.AddressZero, expectedTimestamp, 1, [], Constants.VERSION_1);
		});
	});

	describe('tierClaimed', () => {
		it('should return FALSE if tier not claimed, TRUE if already claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredPercentageBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, mockFunderUuid);

			// ASSUME
			let tierClaimed = await openQProxy.tierClaimed(bountyId, 1);
			expect(tierClaimed).to.equal(false);

			// ACT

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

			// ASSERT
			tierClaimed = await openQProxy.tierClaimed(bountyId, 1);
			expect(tierClaimed).to.equal(true);
		});
	});

	describe('ongoingClaimed', () => {
		it('should return FALSE if ongoing claimant is not claimed, TRUE if it is claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, mockFunderUuid);

			let claimantId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");

			// ASSUME
			let ongoingClaimed = await bounty.claimantId(claimantId);
			expect(ongoingClaimed).to.equal(false);

			// ACT

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedOngoingCloserData);

			// // ASSERT
			ongoingClaimed = await bounty.claimantId(claimantId);
			expect(ongoingClaimed).to.equal(true);
		});
	});

	describe('setFundingGoal', () => {
		it('should set funding goal', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT
			await openQProxy.setFundingGoal(bountyId, mockDai.address, 1000);

			// ASSERT
			let hasFundingGoal = await bounty.hasFundingGoal();
			let fundingTokenAddress = await bounty.fundingToken();
			let fundingGoal = await bounty.fundingGoal();
			expect(hasFundingGoal).to.equal(true);
			expect(fundingTokenAddress).to.equal(mockDai.address);
			expect(fundingGoal).to.equal(1000);
		});

		it('should emit a FundingGoalSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setFundingGoal(bountyId, mockDai.address, 1000))
				.to.emit(openQProxy, 'FundingGoalSet')
				.withArgs(bountyAddress, mockDai.address, 1000, 0, [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setFundingGoal(bountyId, mockDai.address, 1000)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setInvoiceable', () => {
		it('should set invoiceable', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ASSUME
			expect(await bounty.invoiceable()).to.equal(true);

			// ACT
			await openQProxy.setInvoiceable(bountyId, false);

			// ASSERT
			expect(await bounty.invoiceable()).to.equal(false);
		});

		it('should emit an InvoiceableSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setInvoiceable(bountyId, false))
				.to.emit(openQProxy, 'InvoiceableSet')
				.withArgs(bountyAddress, false, [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setInvoiceable(bountyId, false)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setKycRequired', () => {
		it('should set kycRequired', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ASSUME
			expect(await bounty.kycRequired()).to.equal(true);

			// ACT
			await openQProxy.setKycRequired(bountyId, false);

			// ASSERT
			expect(await bounty.kycRequired()).to.equal(false);
		});

		it('should emit an KYCRequiredSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setKycRequired(bountyId, false))
				.to.emit(openQProxy, 'KYCRequiredSet')
				.withArgs(bountyAddress, false, [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setKycRequired(bountyId, false)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setSupportingDocuments', () => {
		it('should set setSupportingDocuments', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ASSUME
			expect(await bounty.supportingDocuments()).to.equal(true);

			// ACT
			await openQProxy.setSupportingDocuments(bountyId, false);

			// ASSERT
			expect(await bounty.supportingDocuments()).to.equal(false);
		});

		it('should emit an SupportingDocumentsSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setSupportingDocuments(bountyId, false))
				.to.emit(openQProxy, 'SupportingDocumentsSet')
				.withArgs(bountyAddress, false, [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setSupportingDocuments(bountyId, false)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setSupportingDocumentsComplete', () => {
		it('should set setSupportingDocumentsComplete', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			let setSupportingDocumentsCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setSupportingDocumentsCompleteData_2 = abiCoder.encode(['uint256', 'bool'], [1, true]);

			// ASSUME
			expect(await bounty.supportingDocumentsComplete(0)).to.equal(false);
			expect(await bounty.supportingDocumentsComplete(1)).to.equal(false);

			// ACT
			await openQProxy.setSupportingDocumentsComplete(bountyId, setSupportingDocumentsCompleteData_1);
			await openQProxy.setSupportingDocumentsComplete(bountyId, setSupportingDocumentsCompleteData_2);

			// ASSERT
			expect(await bounty.supportingDocumentsComplete(0)).to.equal(true);
			expect(await bounty.supportingDocumentsComplete(1)).to.equal(true);
		});

		it('should emit an SupportingDocumentsSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			let setSupportingDocumentsCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);

			// ACT/ASSERT
			await expect(await openQProxy.setSupportingDocumentsComplete(bountyId, setSupportingDocumentsCompleteData_1))
				.to.emit(openQProxy, 'SupportingDocumentsCompletedSet')
				.withArgs(bountyAddress, setSupportingDocumentsCompleteData_1, Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);
			let setSupportingDocumentsCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);

			// ACT/ASSERT
			await expect(notOwnerContract.setSupportingDocumentsComplete(bountyId, setSupportingDocumentsCompleteData_1)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setInvoiceComplete', () => {

		it('should set setInvoiceComplete', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			// ASSUME
			expect(await bounty.invoiceComplete(0)).to.equal(false);
			expect(await bounty.invoiceComplete(1)).to.equal(false);

			let setInvoiceCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setInvoiceCompleteData_2 = abiCoder.encode(['uint256', 'bool'], [1, true]);

			// ACT
			await openQProxy.setInvoiceComplete(bountyId, setInvoiceCompleteData_1);
			await openQProxy.setInvoiceComplete(bountyId, setInvoiceCompleteData_2);

			// ASSERT
			expect(await bounty.invoiceComplete(0)).to.equal(true);
			expect(await bounty.invoiceComplete(1)).to.equal(true);
		});

		it('should emit an InvoiceCompletedSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			let setInvoiceCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);

			// ACT/ASSERT
			await expect(await openQProxy.setInvoiceComplete(bountyId, setInvoiceCompleteData_1))
				.to.emit(openQProxy, 'InvoiceCompletedSet')
				.withArgs(bountyAddress, setInvoiceCompleteData_1, Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			let setInvoiceCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);

			// ACT/ASSERT
			await expect(notOwnerContract.setInvoiceComplete(bountyId, setInvoiceCompleteData_1)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setTierWinner', () => {
		it('should set tier winner', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			// ASSUME
			expect(await bounty.tierWinners(0)).to.equal("");
			expect(await bounty.tierWinners(1)).to.equal("");

			// ACT
			await openQProxy.setTierWinner(bountyId, 0, mockOpenQId);
			await openQProxy.setTierWinner(bountyId, 1, mockOpenQId+"2");

			// ASSERT
			expect(await bounty.tierWinners(0)).to.equal(mockOpenQId);
			expect(await bounty.tierWinners(1)).to.equal(mockOpenQId+"2");
		});

		it('should emit an TierWinnerSelected event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setTierWinner(bountyId, 0, mockOpenQId))
				.to.emit(openQProxy, 'TierWinnerSelected')
				.withArgs(bountyAddress, [mockOpenQId], [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setTierWinner(bountyId, 0, mockOpenQId)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setPayout', () => {
		it('should set payout', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ACT
			await openQProxy.setPayout(bountyId, mockDai.address, 1000);

			// ASSERT
			let payoutTokenAddress = await bounty.payoutTokenAddress();
			let payoutVolume = await bounty.payoutVolume();

			expect(payoutTokenAddress).to.equal(mockDai.address);
			expect(payoutVolume).to.equal(1000);
		});

		it('should emit a PayoutSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setPayout(bountyId, mockDai.address, 1000))
				.to.emit(openQProxy, 'PayoutSet')
				.withArgs(bountyAddress, mockDai.address, 1000, Constants.ONGOING_CONTRACT, [], Constants.VERSION_1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, ongoingBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setPayout(bountyId, mockDai.address, 1000)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setPayoutSchedule', () => {
		it('should revert if payout schedule does not add to 100', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);
			// ACT/ASSERT
			await expect(openQProxy.setPayoutSchedule(bountyId, [20, 23, 43])).to.be.revertedWith('PAYOUT_SCHEDULE_MUST_ADD_TO_100');
		});

		it('should revert if caller is not issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);
			// ACT/ASSERT
			await expect(openQProxy.connect(notIssuer).setPayoutSchedule(bountyId, [20, 23, 43])).to.be.revertedWith('CALLER_NOT_ISSUER');
		});

		it('should set payout schedule', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredPercentageBountyV1.attach(bountyAddress);

			// ACT
			await openQProxy.setPayoutSchedule(bountyId, [70, 20, 10]);

			// ASSERT
			const payoutSchedule = await bounty.getPayoutSchedule();
			const payoutToString = payoutSchedule.map(thing => parseInt(thing.toString()));
			expect(payoutToString[0]).to.equal(70);
			expect(payoutToString[1]).to.equal(20);
			expect(payoutToString[2]).to.equal(10);
		});

		it('should emit PayoutScheduleSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredPercentageBountyV1.attach(bountyAddress);

			await expect(openQProxy.setPayoutSchedule(bountyId, [70, 20, 10]))
				.to.emit(openQProxy, 'PayoutScheduleSet')
				.withArgs(bountyAddress, ethers.constants.AddressZero, [70, 20, 10], 2, [], Constants.VERSION_1);
		});
	});

	describe('setPayoutScheduleFixed', () => {
		it('should revert if caller is not issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			// ACT/ASSERT
			await expect(openQProxy.connect(notIssuer).setPayoutScheduleFixed(bountyId, [1000, 500, 250], mockDai.address)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});

		it('should set payout schedule and payout token address', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			// ACT
			await openQProxy.setPayoutScheduleFixed(bountyId, [70, 20, 10], mockDai.address);

			// ASSERT
			const payoutSchedule = await bounty.getPayoutSchedule();
			const payoutToken = await bounty.payoutTokenAddress();
			const payoutToString = payoutSchedule.map(thing => parseInt(thing.toString()));
			expect(payoutToString[0]).to.equal(70);
			expect(payoutToString[1]).to.equal(20);
			expect(payoutToString[2]).to.equal(10);
			expect(payoutToken).to.equal(mockDai.address);
		});

		it('should emit PayoutScheduleSet event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			await expect(openQProxy.setPayoutScheduleFixed(bountyId, [70, 20, 10], mockDai.address))
				.to.emit(openQProxy, 'PayoutScheduleSet')
				.withArgs(bountyAddress, mockDai.address, [70, 20, 10], 3, [], Constants.VERSION_1);
		});
	});

	describe('associateExternalIdToAddress', () => {
		it('should associate external id to address, and address to external id', async () => {
			const exampleGithubId = 'exampleGithubId';

			// ASSUME
			const zeroAddress = await openQProxy.externalUserIdToAddress(exampleGithubId);
			const emptyString = await openQProxy.addressToExternalUserId(owner.address);

			expect(zeroAddress).to.equal(ethers.constants.AddressZero);
			expect(emptyString).to.equal('');

			// ACT
			await openQProxy.connect(oracle).associateExternalIdToAddress(exampleGithubId, owner.address);

			// ASSERT
			const assocaitedAddress = await openQProxy.externalUserIdToAddress(exampleGithubId);
			const associatedExternalUserId = await openQProxy.addressToExternalUserId(owner.address);

			expect(assocaitedAddress).to.equal(owner.address);
			expect(associatedExternalUserId).to.equal(exampleGithubId);
		});

		it('should emit an event with the correct external user id and assocaited address', async () => {
			// ARRANGE
			const exampleGithubId = 'exampleGithubId';

			// ACT
			await expect(openQProxy.connect(oracle).associateExternalIdToAddress(exampleGithubId, owner.address))
				.to.emit(openQProxy, 'ExternalUserIdAssociatedWithAddress')
				.withArgs(exampleGithubId, owner.address, [], Constants.VERSION_1);
		});
	});

});

async function setNextBlockTimestamp(timestamp = 10) {
	return new Promise(async (resolve,) => {
		const blockNumBefore = await ethers.provider.getBlockNumber();
		const blockBefore = await ethers.provider.getBlock(blockNumBefore);
		const timestampBefore = blockBefore.timestamp;
		const expectedTimestamp = timestampBefore + timestamp;
		await network.provider.send("evm_setNextBlockTimestamp", [expectedTimestamp]);
		resolve(expectedTimestamp);
	});
}