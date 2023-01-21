/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe('DepositManager.sol', () => {
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
	let bountyId = 'mockIssueId';
	let mockOrg = 'mock-org';
	let mockOpenQId = 'mockOpenQId';

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

	let funderUuid = 'mock-funder-uuid';
	let funderUuidEncoded;

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManagerV1');
		const ClaimManager = await ethers.getContractFactory('ClaimManagerV1');

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
		BountyV1 = await ethers.getContractFactory('BountyV1');

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
		
		funderUuidEncoded = abiCoder.encode(["string"], [funderUuid]);

		const atomicBountyAbiEncodedParams = abiCoder.encode(["bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		atomicBountyInitOperation = [0, atomicBountyAbiEncodedParams];

		const ongoingAbiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [mockLink.address, '50', true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		ongoingBountyInitOperation = [1, ongoingAbiEncodedParams];

		const tieredAbiEncodedParams = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[60, 30, 10], true, mockLink.address, 1000, true, true, true, mockOpenQId, "", ""]);
		tieredBountyInitOperation = [2, tieredAbiEncodedParams];

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
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
			const openQTokenWhitelist = await OpenQTokenWhitelist.deploy(20);
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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

			await mockLink.approve(bountyAddress, 10000000);

			// ACT + ASSERT;
			await expect(depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, funderUuid)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should revert if tiered bounty is already closed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			// ACT + ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, funderUuid)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should revert if funded with a non-whitelisted token and bounty is at funded token address capacity', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await blacklistedMockDai.approve(bountyAddress, 10000000);
			await mockLink.approve(bountyAddress, 10000000);

			// set lower capacity for token
			await openQTokenWhitelist.setTokenAddressLimit(1);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, funderUuid);

			// ACT + ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, blacklistedMockDai.address, 10000000, 1, funderUuid)).to.be.revertedWith('TOO_MANY_TOKEN_ADDRESSES');
		});

		it('should ALLOW funding with whitelisted token EVEN IF bounty is at funded token address capacity', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await mockDai.approve(bountyAddress, 10000000);
			await mockLink.approve(bountyAddress, 10000000);

			// set lower capacity for token
			await openQTokenWhitelist.setTokenAddressLimit(1);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, funderUuid);

			// ACT + ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, mockDai.address, 10000000, 1, funderUuid)).to.not.be.revertedWith('TOO_MANY_TOKEN_ADDRESSES');
		});

		it('should set funder to msg.sender', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, funderUuid);

			const depositId = generateDepositId(bountyId, 0);

			// ASSERT
			expect(await bounty.funder(depositId)).to.equal(owner.address);
		});

		it('should deposit the correct amount from sender to bounty', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

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
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, value, 1, funderUuid);
			await depositManager.fundBountyToken(bountyAddress, mockDai.address, value, 1, funderUuid);

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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			await mockNft.approve(bountyAddress, 1);

			// ASSUME
			expect(await mockNft.ownerOf(1)).to.equal(owner.address);

			const depositId = generateDepositId(bountyId, 0);
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT/ASSERT
			await expect(depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0))
				.to.emit(depositManager, 'NFTDepositReceived')
				.withArgs(depositId, bountyAddress, bountyId, mockOrg, mockNft.address, expectedTimestamp, owner.address, 1, 1, 0, [], 2);
		});

		it('should emit a DepositReceived event with expected bountyId, bounty address, token address, funder, volume, timestamp, depositId, tokenStandard, tokenId, bountyType and data', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await mockLink.approve(bountyAddress, 10000000);

			const Bounty = await ethers.getContractFactory('BountyV1');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			const depositId = generateDepositId(bountyId, 0);
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			// ASSERT
			await expect(depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, funderUuid))
				.to.emit(depositManager, 'TokenDepositReceived')
				.withArgs(depositId, bountyAddress, bountyId, mockOrg, mockLink.address, expectedTimestamp, owner.address, 1, 100, 0, funderUuidEncoded, 2);
		});
	});

	describe('refundDeposits', () => {
		describe('Event Emissions', () => {
			it('should emit DepositRefunded event for refunded deposit', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV1');
				const bounty = await Bounty.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);

				const volume = 100;
				const depositedTimestamp = await setNextBlockTimestamp();
				const tokenDepositId = generateDepositId(bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, funderUuid);

				const protocolDepositId = generateDepositId(bountyId, 1);
				await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, funderUuid, { value: volume });

				const expectedTimestamp = await setNextBlockTimestamp(2764800);

				// ACT
				// ASSERT
				await expect(depositManager.refundDeposit(bountyAddress, protocolDepositId))
					.to.emit(depositManager, 'DepositRefunded')
					.withArgs(protocolDepositId, bountyId, bountyAddress, mockOrg, expectedTimestamp, ethers.constants.AddressZero, volume, 0, [], 2);

				const secondExpectedTimestamp = await setNextBlockTimestamp(2764810);

				await expect(depositManager.refundDeposit(bountyAddress, tokenDepositId))
					.to.emit(depositManager, 'DepositRefunded')
					.withArgs(tokenDepositId, bountyId, bountyAddress, mockOrg, secondExpectedTimestamp, mockLink.address, volume, 0, [], 2);
			});
		});

		describe('requires and reverts', () => {
			it('should revert if attempt to withdraw too early', async () => {
				// Mint Bounty
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// Get Escrow Period
				bounty = await BountyV1.attach(bountyAddress);

				// Fund Bounty
				await mockDai.approve(bountyAddress, 100000);

				const depositId = generateDepositId(bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockDai.address, 100000, 276000, funderUuid);

				// ACT / ASSERT
				await expect(depositManager.refundDeposit(bountyAddress, depositId)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});

			it('should revert if not funder', async () => {
				// ARRANGE
				// Mint Bounty
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// Get Escrow Period
				bounty = await BountyV1.attach(bountyAddress);

				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(bountyId, 0);

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
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV1');
				const bounty = await Bounty.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);
				const volume = 100;

				const linkDepositId = generateDepositId(bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, funderUuid);

				const daiDepositId = generateDepositId(bountyId, 1);
				await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1, funderUuid);

				const protocolDepositId = generateDepositId(bountyId, 2);
				await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, funderUuid, { value: volume });

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

				const newBounty = await Bounty.attach(
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

			it('should transfer rest tokens when part claimed (ongoing)', async () => {

				// ARRANGE
				// Testing scenario: 
				// 2 refundable deposits of 100 each and one locked deposit of 100
				// Claimant gets 50
				// 1 total refund and one refund of 50 are possible
				// cannot refund the locked deposit of 100 - which can only be tapped into for claims until expiration

				// ??? should all token types be added to the test like above??

				// is initiating with mocklink address
				await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV1');
				const bounty = await Bounty.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);
				const volume = 100;

				// 2 refundable of 100 and 1 locked of 100 => claim 50 => refund possible 150
				const linkDepositId = generateDepositId(bountyId, 0);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, funderUuid);
				const linkDepositId2 = generateDepositId(bountyId, 1);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, funderUuid);
				const linkDepositId3 = generateDepositId(bountyId, 2);
				await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 3000000, funderUuid);

				// await ??? 
				const thirtyTwoDays = 2765000;
				ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(bountyMockTokenBalance).to.equal('300');

				const funderMockTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance).to.equal('9999999999999999999700');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				// Claim of 50 made by someone else
				// ACT
				await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedOngoingCloserData);

				// ASSERT
				const bountyMockTokenBalance2 = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(bountyMockTokenBalance2).to.equal('250');

				const funderMockTokenBalance2 = (await mockLink.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance2).to.equal('9999999999999999999700');

				// 1st refund - 100 allowed
				// ACT
				await depositManager.refundDeposit(bountyAddress, linkDepositId);

				// ASSERT
				const bountyMockTokenBalance3 = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(bountyMockTokenBalance3).to.equal('150');

				const funderMockTokenBalance3 = (await mockLink.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance3).to.equal('9999999999999999999800');

				// 2nd refund - 50 allowed
				// ACT
				await depositManager.refundDeposit(bountyAddress, linkDepositId2);

				// ASSERT
				const bountyMockTokenBalance4 = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(bountyMockTokenBalance4).to.equal('100');

				const funderMockTokenBalance4 = (await mockLink.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance4).to.equal('9999999999999999999850');

				// 2nd claim of 50 possible on the remaining locked funds
				// ACT
				await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedOngoingCloserData);

				// ASSERT
				const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(newBountyMockTokenBalance).to.equal('50');

				const newFunderMockTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
				expect(newFunderMockTokenBalance).to.equal('9999999999999999999850');

			});

			it('should transfer NFT from bounty contract to funder', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV1');
				const bounty = await Bounty.attach(bountyAddress);

				await mockNft.approve(bountyAddress, 1);

				const depositId = generateDepositId(bountyId, 0);
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
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, funderUuid);

			const depositId = generateDepositId(bountyId, 0);

			// ACT
			await depositManager.extendDeposit(bountyAddress, depositId, 1000);

			// ASSERT
			// This will fail to revert without a deposit extension. Cannot test the counter case due to the inability to call refund twice, see DEPOSIT_ALREADY_REFUNDED
			await expect(depositManager.refundDeposit(bountyAddress, depositId)).to.be.revertedWith("PREMATURE_REFUND_REQUEST");
		});

		it('should emit DepositExtended event', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, 1, funderUuid);

			const depositId = generateDepositId(bountyId, 0);

			// ACT
			await expect(depositManager.extendDeposit(bountyAddress, depositId, 1000))
				.to.emit(depositManager, 'DepositExtended')
				.withArgs(depositId, 1001, 0, [], 2);
		});

		it('should extend past expiration period if not yet expired', async () => {
			// Mint Bounty & be the funder
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);

			// Make deposit with expiration 10 days and get the deposit ID
			const firstLockPeriod = 864000;
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, firstLockPeriod, funderUuid);
			const depositId = generateDepositId(bountyId, 0);

			// ACT / ASSERT
			const secondLockPeriod = 2000;
			await depositManager.extendDeposit(bountyAddress, depositId, secondLockPeriod);
			const escrowPeriod = await bounty.expiration(depositId);
			expect(escrowPeriod).to.equal(firstLockPeriod + secondLockPeriod);
		});

		it('should start from current time for expiration if expired', async () => {
			// Mint Bounty & be the funder
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);

			// Make deposit and get the deposit ID
			const firstLockPeriod = 1000;
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 100, firstLockPeriod, funderUuid);
			const depositId = generateDepositId(bountyId, 0);

			// ADVANCE TIME (past expiration period)
			const timePastSinceLock = 2000;
			await ethers.provider.send("evm_increaseTime", [timePastSinceLock]);

			// ACT / ASSERT
			const secondLockPeriod = 4000;

			await depositManager.extendDeposit(bountyAddress, depositId, secondLockPeriod);
			const escrowPeriod = await bounty.expiration(depositId);
			expect(escrowPeriod).to.equal(timePastSinceLock + secondLockPeriod);
		});

		it('should revert if not funder', async () => {
			// ARRANGE
			// Mint Bounty & generate Deposit
			await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const depositId = generateDepositId(bountyId, 0);

			// ACT / ASSERT 
			// deposit extension of 10 days 
			await expect(depositManager.extendDeposit(bountyAddress, depositId, 864000)).to.be.revertedWith('CALLER_NOT_FUNDER');
		});

	});

	describe('getLockedFunds helper', () => {
		it('should return total locked funds on bounty for a specific token (funds only available for claims)', async () => {
			// ARRANGE
			// Testing scenario: 
			// 1 refundable deposit of 100 and one locked deposit of 100 => locked funds = 100
			// Claimant gets 50 => locked funds = 100
			// 1 new locked deposit of 100 => locked funds of 200 

			await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			const volume = 100;

			// 1 refundable deposit of 100 and 1 locked of 100 
			const linkDepositId = generateDepositId(bountyId, 0);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, funderUuid);
			const linkDepositId2 = generateDepositId(bountyId, 1);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 3000000, funderUuid);

			// ASSUME
			const thirtyTwoDays = 2765000;
			ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

			const bountyMockTokenBalance = (await bounty.getLockedFunds(bountyAddress, mockLink.address)).toString();
			expect(bountyMockTokenBalance).to.equal('100');

			const newBounty = await Bounty.attach(
				bountyAddress
			);

			// Claim of 50
			// ACT
			await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedOngoingCloserData);

			// ASSERT
			const bountyMockTokenBalance2 = (await bounty.getLockedFunds(bountyAddress, mockLink.address)).toString();
			expect(bountyMockTokenBalance2).to.equal('100');

			// Additional locked deposit of 100
			// ACT
			const linkDepositId3 = generateDepositId(bountyId, 2);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 3000000, funderUuid);

			// ASSERT
			const bountyMockTokenBalance3 = (await bounty.getLockedFunds(bountyAddress, mockLink.address)).toString();
			expect(bountyMockTokenBalance3).to.equal('200');

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