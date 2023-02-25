/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');
const { 
	Constants, 
	atomicBountyInitOperation_fundingGoal, 
	atomicBountyInitOperation_noFundingGoal, 
	atomicBountyInitOperation_permissioned,
	tieredFixedBountyInitOperationBuilder_permissionless
} = require('./constants');

describe.only('DepositManager.sol', () => {
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

	let depositManagerImplementation;

	// ACCOUNTS
	let owner;
	let oracle;
	let claimant;

	// CONSTANTS
	let funderUuidEncoded;

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let tieredFixedBountyInitOperation;

	// CLOSER DATA
	let abiCoder;

	let abiEncodedSingleCloserData;
	let abiEncodedTieredCloserData;

	let AtomicBountyV1
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
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');

		// BOUNTY IMPLEMENTATIONS
		atomicBountyV1 = await AtomicBountyV1.deploy();
		await atomicBountyV1.deployed();
		
		tieredFixedBountyV1 = await TieredFixedBountyV1.deploy();
		await tieredFixedBountyV1.deployed();

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');

		[owner, claimant, oracle, claimantSecondPlace, claimManager] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize();

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		blacklistedMockDai = await MockDai.deploy();
		await blacklistedMockDai.deployed();

		mockNft = await MockNft.deploy();
		await mockNft.deployed();

		openQTokenWhitelist = await OpenQTokenWhitelist.deploy();
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

		tieredFixedBountyBeacon = await BountyBeacon.deploy(tieredFixedBountyV1.address);
		await tieredFixedBountyBeacon.deployed();

		// BOUNTY FACTORY
		bountyFactory = await BountyFactory.deploy(
			openQProxy.address,
			atomicBountyBeacon.address,
			tieredFixedBountyBeacon.address
			);
		await bountyFactory.deployed();

		// DEPOSIT MANAGER //

		depositManagerImplementation = await DepositManager.deploy();
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

		await openQProxy.setBountyFactory(bountyFactory.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;
		
		funderUuidEncoded = abiCoder.encode(["string"], [Constants.funderUuid]);

		atomicBountyInitOperation = atomicBountyInitOperation_fundingGoal(mockLink.address)
		tieredFixedBountyInitOperation = tieredFixedBountyInitOperationBuilder_permissionless(mockLink.address)

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
	});

	describe('initialization', () => {
		it('should initialize with correct fields', async () => {
			expect(await depositManager.owner()).equals(owner.address);
		});
	});

	describe('setOpenQTokenWhitelist', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();

			// ACT / ASSERT
			await expect(depositManager.connect(notOwner).setTokenWhitelist(owner.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await depositManagerImplementation.initialize();
			await expect(depositManagerImplementation.setTokenWhitelist(owner.address)).to.be.revertedWith('Function must be called through delegatecall');
		});

		it('should set OpenQTokenWhitelist', async () => {
			// ASSUME
			const DepositManager = await ethers.getContractFactory('DepositManagerV1');
			let freshDepositManager = await DepositManager.deploy();
			await freshDepositManager.deployed();
			await freshDepositManager.initialize();

			expect(await freshDepositManager.openQTokenWhitelist()).equals(ethers.constants.AddressZero);

			// ARRANGE
			const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
			const openQTokenWhitelist = await OpenQTokenWhitelist.deploy();
			await openQTokenWhitelist.deployed();

			// ACT
			await depositManager.setTokenWhitelist(openQTokenWhitelist.address);

			// ASSERT
			expect(await depositManager.openQTokenWhitelist()).equals(openQTokenWhitelist.address);
		});
	});

	describe('fundBounty', () => {
		it('should revert if bounty is already closed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

			await mockLink.approve(bountyAddress, 10000000);

			// ACT + ASSERT;
			await expect(depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should revert if funded with a non-whitelisted token', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await blacklistedMockDai.approve(bountyAddress, 10000000);
			await mockLink.approve(bountyAddress, 10000000);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

			// ACT + ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, blacklistedMockDai.address, 10000000, 1, Constants.funderUuid)).to.be.revertedWith('TOKEN_NOT_ACCEPTED');
		});

		it('should set funder to msg.sender', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, Constants.funderUuid);

			const depositId = generateDepositId(Constants.bountyId, 0);

			// ASSERT
			expect(await bounty.funder(depositId)).to.equal(owner.address);
		});

		it('should deposit the correct amount from sender to bounty', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			// ASSUME
			const initialFunderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
			const initialFunderMockDaiBalance = (await mockLink.balanceOf(owner.address)).toString();
			expect(initialFunderMockLinkBalance).to.equal('10000000000000000000000');
			expect(initialFunderMockDaiBalance).to.equal('10000000000000000000000');

			const initialIssueMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
			const initialIssueMockDaiBalance = (await mockDai.balanceOf(bounty.address)).toString();
			expect(initialIssueMockLinkBalance).to.equal('0');
			expect(initialIssueMockDaiBalance).to.equal('0');

			// ARRANGE
			await mockLink.approve(bounty.address, 10000000);
			await mockDai.approve(bounty.address, 10000000);

			// ACT
			const value = 100;
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, value, 1, Constants.funderUuid);
			await depositManager.fundBountyToken(bountyAddress, mockDai.address, value, 1, Constants.funderUuid);

			// // ASSERT
			const funderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
			const funderFakeTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
			expect(funderMockLinkBalance).to.equal('9999999999999999999900');
			expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

			const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
			const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
			expect(bountyMockTokenBalance).to.equal('100');
			expect(bountyFakeTokenBalance).to.equal('100');
		});

		it('should transfer NFT from sender to bounty', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			await mockNft.approve(bountyAddress, 1);

			// ASSUME
			expect(await mockNft.ownerOf(1)).to.equal(owner.address);

			// ACT
			await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0);

			// ASSERT
			expect(await mockNft.ownerOf(1)).to.equal(bountyAddress);
		});

		it('should emit an NFTDepositReceived event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			await mockNft.approve(bountyAddress, 1);

			// ASSUME
			expect(await mockNft.ownerOf(1)).to.equal(owner.address);

			const depositId = generateDepositId(Constants.bountyId, 0);
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT/ASSERT
			await expect(depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0))
				.to.emit(depositManager, 'NFTDepositReceived')
				.withArgs(depositId, bountyAddress, Constants.bountyId, Constants.organization, mockNft.address, expectedTimestamp, owner.address, 1, 1, 0, [], Constants.VERSION_1);
		});

		it('should emit a DepositReceived event with expected bountyId, bounty address, token address, funder, volume, timestamp, depositId, tokenStandard, tokenId, bountyType and data', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await mockLink.approve(bountyAddress, 10000000);

			const bounty = await AtomicBountyV1.attach(
				bountyAddress
			);

			const depositId = generateDepositId(Constants.bountyId, 0);
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			// ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, Constants.funderUuid))
				.to.emit(depositManager, 'TokenDepositReceived')
				.withArgs(depositId, bountyAddress, Constants.bountyId, Constants.organization, mockLink.address, expectedTimestamp, owner.address, 1, 100, 0, funderUuidEncoded, Constants.VERSION_1);
		});
	});

	describe('refundDeposits', () => {
		describe('Event Emissions', () => {
			it('should emit DepositRefunded event for refunded deposit', async () => {
				// ARRANGE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
				const bounty = await AtomicBountyV1.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);

				const volume = 100;
				const depositedTimestamp = await setNextBlockTimestamp();
				const tokenDepositId = generateDepositId(Constants.bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);

				const protocolDepositId = generateDepositId(Constants.bountyId, 1);
				await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, Constants.funderUuid, { value: volume });

				const expectedTimestamp = await setNextBlockTimestamp(2764800);

				// ACT
				// ASSERT
				await expect(depositManager.refundDeposit(bountyAddress, protocolDepositId))
					.to.emit(depositManager, 'DepositRefunded')
					.withArgs(protocolDepositId, Constants.bountyId, bountyAddress, Constants.organization, expectedTimestamp, ethers.constants.AddressZero, volume, 0, [], Constants.VERSION_1);

				const secondExpectedTimestamp = await setNextBlockTimestamp(2764810);

				await expect(depositManager.refundDeposit(bountyAddress, tokenDepositId))
					.to.emit(depositManager, 'DepositRefunded')
					.withArgs(tokenDepositId, Constants.bountyId, bountyAddress, Constants.organization, secondExpectedTimestamp, mockLink.address, volume, 0, [], Constants.VERSION_1);
			});
		});

		describe('requires and reverts', () => {
			it('should revert if attempt to withdraw too early', async () => {
				// Mint Bounty
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

				// Get Escrow Period
				bounty = await AtomicBountyV1.attach(bountyAddress);

				// Fund Bounty
				await mockDai.approve(bountyAddress, 100000);

				const depositId = generateDepositId(Constants.bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockDai.address, 100000, 276000, Constants.funderUuid);

				// ACT / ASSERT
				await expect(depositManager.refundDeposit(bountyAddress, depositId)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});

			it('should revert if not funder', async () => {
				// ARRANGE
				// Mint Bounty
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

				// Get Escrow Period
				bounty = await AtomicBountyV1.attach(bountyAddress);

				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(Constants.bountyId, 0);

				const escrowPeriod = await bounty.expiration(depositId);

				// ADVANCE TIME
				const thirtyTwoDays = 2765000;
				ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

				// ACT / ASSERT
				await expect(depositManager.refundDeposit(bountyAddress, depositId)).to.be.revertedWith('CALLER_NOT_FUNDER');
			});
		});

		describe('transfer', () => {
			it('should transfer refunded deposit volume from bounty contract to funder', async () => {
				// ARRANGE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
				const bounty = await AtomicBountyV1.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);
				const volume = 100;

				const linkDepositId = generateDepositId(Constants.bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);

				const daiDepositId = generateDepositId(Constants.bountyId, 1);
				await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1, Constants.funderUuid);

				const protocolDepositId = generateDepositId(Constants.bountyId, 2);
				await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, Constants.funderUuid, { value: volume });

				const thirtyTwoDays = 2765000;
				ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
				const bountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
				expect(bountyProtocolTokenBalance).to.equal('100');

				const funderMockTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				const newBounty = await AtomicBountyV1.attach(
					bountyAddress
				);

				// ACT
				await depositManager.refundDeposit(bountyAddress, linkDepositId);
				await depositManager.refundDeposit(bountyAddress, daiDepositId);
				await depositManager.refundDeposit(bountyAddress, protocolDepositId);

				// // ASSERT
				const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
				const newBountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
				expect(newBountyMockTokenBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');
				expect(newBountyProtocolTokenBalance).to.equal('0');

				const newFunderMockTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
				const newFunderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(newFunderMockTokenBalance).to.equal('10000000000000000000000');
				expect(newFunderFakeTokenBalance).to.equal('10000000000000000000000');
			});

			it('should transfer NFT from bounty contract to funder', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
				const bounty = await AtomicBountyV1.attach(bountyAddress);

				await mockNft.approve(bountyAddress, 1);

				const depositId = generateDepositId(Constants.bountyId, 0);
				await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(bountyAddress);

				// ACT
				await depositManager.refundDeposit(bountyAddress, depositId);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
		});
	});

	describe('extendDeposit', () => {
		it('should extend deposit', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, Constants.funderUuid);

			const depositId = generateDepositId(Constants.bountyId, 0);

			// ACT
			await depositManager.extendDeposit(bountyAddress, depositId, 1000);

			// ASSERT
			// This will fail to revert without a deposit extension. Cannot test the counter case due to the inability to call refund twice, see DEPOSIT_ALREADY_REFUNDED
			await expect(depositManager.refundDeposit(bountyAddress, depositId)).to.be.revertedWith("PREMATURE_REFUND_REQUEST");
		});

		it('should emit DepositExtended event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, Constants.funderUuid);

			const depositId = generateDepositId(Constants.bountyId, 0);

			// ACT
			await expect(depositManager.extendDeposit(bountyAddress, depositId, 1000))
				.to.emit(depositManager, 'DepositExtended')
				.withArgs(depositId, 1001, 0, [], Constants.VERSION_1);
		});

		it('should extend past expiration period if not yet expired', async () => {
			// Mint Bounty & be the funder
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await AtomicBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);

			// Make deposit with expiration 10 days and get the deposit ID
			const firstLockPeriod = 864000;
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, firstLockPeriod, Constants.funderUuid);
			const depositId = generateDepositId(Constants.bountyId, 0);

			// ACT / ASSERT
			const secondLockPeriod = 2000;
			await depositManager.extendDeposit(bountyAddress, depositId, secondLockPeriod);
			const escrowPeriod = await bounty.expiration(depositId);
			expect(escrowPeriod).to.equal(firstLockPeriod + secondLockPeriod);
		});

		it('should revert if not funder', async () => {
			// ARRANGE
			// Mint Bounty & generate Deposit
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const depositId = generateDepositId(Constants.bountyId, 0);

			// ACT / ASSERT 
			// deposit extension of 10 days 
			await expect(depositManager.extendDeposit(bountyAddress, depositId, 864000)).to.be.revertedWith('CALLER_NOT_FUNDER');
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