/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe.only('OpenQV1.sol', () => {
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

	// CONSTANTS
	let bountyId = 'mockIssueId';
	let mockOrg = 'mock-org';

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredBountyInitOperation;

	// CLOSER DATA
	let abiCoder;

	let abiEncodedSingleCloserData;
	let abiEncodedOngoingCloserData;
	let abiEncodedTieredCloserData;

	let BountyV1;

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManager');
		const ClaimManager = await ethers.getContractFactory('ClaimManager');

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
		BountyV1 = await ethers.getContractFactory('BountyV1');

		[owner, claimant, oracle, claimantSecondPlace] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize();

		depositManager = await DepositManager.deploy();
		await depositManager.deployed();
		await depositManager.initialize();

		claimManager = await ClaimManager.deploy();
		await claimManager.deployed();
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

		const bountyV1 = await BountyV1.deploy();
		await bountyV1.deployed();

		const beacon = await BountyBeacon.deploy(bountyV1.address);
		await beacon.deployed();

		bountyFactory = await BountyFactory.deploy(openQProxy.address, beacon.address);
		await bountyFactory.deployed();

		await openQProxy.setBountyFactory(bountyFactory.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;

		const atomicBountyAbiEncodedParams = abiCoder.encode(["bool", "address", "uint256"], [true, mockLink.address, 1000]);
		atomicBountyInitOperation = [0, atomicBountyAbiEncodedParams];

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256"], [mockLink.address, '100', true, mockLink.address, 1000]);
		ongoingBountyInitOperation = [1, abiEncodedParams];

		const tieredAbiEncodedParams = abiCoder.encode(["uint256[]", "bool", "address", "uint256"], [[60, 30, 10], true, mockLink.address, 1000]);
		tieredBountyInitOperation = [2, tieredAbiEncodedParams];

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
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
				// ARRANGE
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const newBountyId = await newBounty.bountyId();
				const bountyCreatedTime = (await newBounty.bountyCreatedTime()).toNumber();
				const bountyClosedTime = await newBounty.bountyClosedTime();
				const issuer = await newBounty.issuer();
				const closer = await newBounty.closer();
				const status = await newBounty.status();
				const bountyType = await newBounty.bountyType();
				const payoutVolume = await newBounty.payoutVolume();
				const payoutTokenAddress = await newBounty.payoutTokenAddress();
				const depositManagerBounty = await newBounty.depositManager();
				const claimManagerBounty = await newBounty.claimManager();

				// ASSERT
				expect(bountyId).to.equal(newBountyId);
				expect(bountyCreatedTime).to.equal(expectedTimestamp);
				expect(bountyClosedTime).to.equal(0);
				expect(issuer).to.equal(owner.address);
				expect(closer).to.equal(ethers.constants.AddressZero);
				expect(status).to.equal(0);
				expect(bountyType).to.equal(1);
				expect(payoutVolume).to.equal(100);
				expect(payoutTokenAddress).to.equal(mockLink.address);
				expect(depositManagerBounty).to.equal(depositManager.address);
				expect(claimManagerBounty).to.equal(claimManager.address);
			});

			it('should revert if bounty already exists', async () => {
				// ARRANGE
				// ACT
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				// ASSERT
				await expect(openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation)).to.be.revertedWith('BOUNTY_ALREADY_EXISTS');
			});

			it('should store bountyId to bountyAddress', async () => {
				// ACT
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const newBountyId = await newBounty.bountyId();

				const bountyIdFromAddress = await openQProxy.bountyAddressToBountyId(bountyAddress);
				expect(bountyIdFromAddress).to.equal(newBountyId);

				const bountyAddressFromId = await openQProxy.bountyIdToAddress(newBountyId);
				expect(bountyAddressFromId).to.equal(bountyAddress);
			});

			it('should emit a BountyCreated event with expected bounty id, issuer address, bounty address, bountyMintTime, bountyType, and data', async () => {
				// ARRANGE
				const mockOrg = "OpenQDev";
				const expectedBountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				let expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT

				// SINGLE
				let txnSingle;
				await expect(txnSingle = await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation))
					.to.emit(openQProxy, 'BountyCreated')
					.withArgs(bountyId, mockOrg, owner.address, anyValue, expectedTimestamp, 0, [], 1);
				txnReceipt = await txnSingle.wait(); // 0ms, as tx is already confirmed
				event = txnReceipt.events.find(event => event.event === 'BountyCreated');
				[bountyAddress] = event.args;
				expect(bountyAddress).to.not.equal(ethers.constants.AddressZero);

				// // ONGOING
				let txnOngoing;
				expectedTimestamp = await setNextBlockTimestamp();
				await expect(txnOngoing = await openQProxy.mintBounty('ongoingBountyId', mockOrg, ongoingBountyInitOperation))
					.to.emit(openQProxy, 'BountyCreated')
					.withArgs('ongoingBountyId', mockOrg, owner.address, anyValue, expectedTimestamp, 1, [], 1);
				txnReceipt = await txnOngoing.wait(); // 0ms, as tx is already confirmed
				event = txnReceipt.events.find(event => event.event === 'BountyCreated');
				[bountyAddress] = event.args;
				expect(bountyAddress).to.not.equal(ethers.constants.AddressZero);

				// // TIERED
				let txnTiered;
				expectedTimestamp = await setNextBlockTimestamp();
				await expect(txnTiered = await openQProxy.mintBounty('tieredBountyId', mockOrg, tieredBountyInitOperation))
					.to.emit(openQProxy, 'BountyCreated')
					.withArgs('tieredBountyId', mockOrg, owner.address, anyValue, expectedTimestamp, 2, [], 1);
				txnReceipt = await txnTiered.wait(); // 0ms, as tx is already confirmed
				event = txnReceipt.events.find(event => event.event === 'BountyCreated');
				[bountyAddress] = event.args;
				expect(bountyAddress).to.not.equal(ethers.constants.AddressZero);
			});
		});

		describe('ONGOING', () => {
			it('should correctly init bountyType, payoutToken and payoutVolume', async () => {
				// ARRANGE
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const newBountyId = await newBounty.bountyId();
				const bountyCreatedTime = (await newBounty.bountyCreatedTime()).toNumber();
				const bountyClosedTime = await newBounty.bountyClosedTime();
				const issuer = await newBounty.issuer();
				const closer = await newBounty.closer();
				const status = await newBounty.status();
				const bountyType = await newBounty.bountyType();
				const payoutVolume = await newBounty.payoutVolume();
				const payoutTokenAddress = await newBounty.payoutTokenAddress();

				// ASSERT
				expect(bountyId).to.equal(newBountyId);
				expect(bountyCreatedTime).to.equal(expectedTimestamp);
				expect(bountyClosedTime).to.equal(0);
				expect(issuer).to.equal(owner.address);
				expect(closer).to.equal(ethers.constants.AddressZero);
				expect(status).to.equal(0);
				expect(bountyType).to.equal(1);
				expect(payoutVolume).to.equal(100);
				expect(payoutTokenAddress).to.equal(mockLink.address);
			});
		});

		describe('TIERED', () => {
			it('should correctly init bountyType and payout schedule', async () => {
				// ARRANGE
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);

				const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const newBountyId = await newBounty.bountyId();
				const bountyCreatedTime = (await newBounty.bountyCreatedTime()).toNumber();
				const bountyClosedTime = await newBounty.bountyClosedTime();
				const issuer = await newBounty.issuer();
				const closer = await newBounty.closer();
				const status = await newBounty.status();
				const bountyType = await newBounty.bountyType();
				const payoutSchedule = await newBounty.getPayoutSchedule();
				const payoutToString = payoutSchedule.map(thing => parseInt(thing.toString()));

				// ASSERT
				expect(bountyId).to.equal(newBountyId);
				expect(bountyCreatedTime).to.equal(expectedTimestamp);
				expect(bountyClosedTime).to.equal(0);
				expect(issuer).to.equal(owner.address);
				expect(closer).to.equal(ethers.constants.AddressZero);
				expect(status).to.equal(0);
				expect(bountyType).to.equal(2);
				expect(payoutToString[0]).to.equal(60);
				expect(payoutToString[1]).to.equal(30);
				expect(payoutToString[2]).to.equal(10);
			});
		});
	});

	describe('closeCompetition', () => {
		it('should close competition', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ACT
			await openQProxy.closeCompetition(bountyId);

			// ASSERT
			status = await bounty.status();
			expect(status).to.equal(1);
		});

		it('should revert if not compeititon', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ASSERT
			await expect(openQProxy.closeCompetition(bountyId)).to.be.revertedWith('NOT_A_COMPETITION_BOUNTY');
		});

		it('should emit BountyClosed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			const expectedTimestamp = await setNextBlockTimestamp();
			// ACT
			await expect(openQProxy.closeCompetition(bountyId))
				.to.emit(openQProxy, 'BountyClosed')
				.withArgs(bountyId, anyValue, mockOrg, ethers.constants.AddressZero, expectedTimestamp, 2, [], 1);
		});
	});

	describe('closeOngoing', () => {
		it('should close ongoing', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			// ASSERT
			await expect(openQProxy.closeOngoing(bountyId)).to.be.revertedWith('NOT_AN_ONGOING_BOUNTY');
		});

		it('should emit BountyClosed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ASSUME
			let status = await bounty.status();
			expect(status).to.equal(0);

			const expectedTimestamp = await setNextBlockTimestamp();
			// ACT
			await expect(openQProxy.closeOngoing(bountyId))
				.to.emit(openQProxy, 'BountyClosed')
				.withArgs(bountyId, anyValue, mockOrg, ethers.constants.AddressZero, expectedTimestamp, 1, [], 1);
		});
	});

	describe('tierClaimed', () => {
		it('should return FALSE if tier not claimed, TRUE if already claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1);

			await openQProxy.closeCompetition(bountyId);

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
			await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1);

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

	describe('fundingGoalSet', () => {
		it('should set funding goal', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setFundingGoal(bountyId, mockDai.address, 1000))
				.to.emit(openQProxy, 'FundingGoalSet')
				.withArgs(bountyAddress, mockDai.address, 1000, 0, [], 1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setFundingGoal(bountyId, mockDai.address, 1000)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});
	});

	describe('setPayout', () => {
		it('should set payout', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ACT/ASSERT
			await expect(await openQProxy.setPayout(bountyId, mockDai.address, 1000))
				.to.emit(openQProxy, 'PayoutSet')
				.withArgs(bountyAddress, mockDai.address, 1000, 0, [], 1);
		});

		it('should revert if not called by issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const notOwnerContract = openQProxy.connect(oracle);

			// ACT/ASSERT
			await expect(notOwnerContract.setPayout(bountyId, mockDai.address, 1000)).to.be.revertedWith('CALLER_NOT_ISSUER');
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