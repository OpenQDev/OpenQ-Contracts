/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe('OpenQV0.sol', () => {
	let openQProxy;
	let openQImplementation;
	let owner;
	let mockLink;
	let mockDai;
	let blacklistedMockDai;
	let mockNft;
	let openQTokenWhitelist;
	let bountyId = 'mockIssueId';
	let oracle;

	beforeEach(async () => {
		const OpenQStorage = await ethers.getContractFactory('OpenQStorage');
		const OpenQImplementation = await ethers.getContractFactory('OpenQV0');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');

		[owner, , oracle] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV0 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize(oracle.address);

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

		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();

		bountyFactory = await BountyFactory.deploy(openQProxy.address);
		await bountyFactory.deployed();

		await openQProxy.setOpenQStorage(openQStorage.address);
		await openQProxy.setBountyFactory(bountyFactory.address);
		await openQProxy.transferOracle(oracle.address);
		await openQProxy.setTokenWhitelist(openQTokenWhitelist.address);
	});

	describe('initialization', () => {
		it('should initialize with correct fields', async () => {
			expect(await openQProxy.owner()).equals('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
			expect(await openQProxy.oracle()).equals('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
		});

		it('should only be initialized once', async () => {
			await expect(openQProxy.initialize(oracle.address)).to.be.revertedWith('Initializable: contract is already initialized');
		});
	});

	describe('mintBounty', () => {
		it('should deploy a new bounty contract with expected initial metadata', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			await openQProxy.mintBounty(bountyId, 'mock-org');

			const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			const Bounty = await ethers.getContractFactory('BountyV0');

			const newBounty = await Bounty.attach(
				bountyAddress
			);

			const newBountyId = await newBounty.bountyId();
			const bountyCreatedTime = (await newBounty.bountyCreatedTime()).toNumber();
			const bountyClosedTime = await newBounty.bountyClosedTime();
			const issuer = await newBounty.issuer();
			const closer = await newBounty.closer();
			const status = await newBounty.status();

			// ASSERT
			expect(bountyId).to.equal(newBountyId);
			expect(bountyCreatedTime).to.equal(expectedTimestamp);
			expect(bountyClosedTime).to.equal(0);
			expect(issuer).to.equal(owner.address);
			expect(closer).to.equal(ethers.constants.AddressZero);
			expect(status).to.equal(0);
		});

		it('should revert if bounty already exists', async () => {
			// ARRANGE
			// ACT
			await openQProxy.mintBounty(bountyId, 'mock-org');

			// ASSERT
			await expect(openQProxy.mintBounty(bountyId, 'mock-org')).to.be.revertedWith('ERC1167: create2 failed');
		});

		it('should store bountyId to bountyAddress', async () => {
			// ACT
			await openQProxy.mintBounty(bountyId, 'mock-org');

			const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			const Bounty = await ethers.getContractFactory('BountyV0');

			const newBounty = await Bounty.attach(
				bountyAddress
			);

			const newBountyId = await newBounty.bountyId();

			const bountyIdFromAddress = await openQProxy.bountyAddressToBountyId(bountyAddress);
			expect(bountyIdFromAddress).to.equal(newBountyId);

			const bountyAddressFromId = await openQProxy.bountyIdToAddress(newBountyId);
			expect(bountyAddressFromId).to.equal(bountyAddress);
		});

		it('should emit a BountyCreated event with expected bounty id, issuer address, bounty address, and bountyMintTime', async () => {
			// ARRANGE
			const mockOrg = "OpenQDev";
			const expectedBountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			// ASSERT
			await expect(openQProxy.mintBounty(bountyId, mockOrg))
				.to.emit(openQProxy, 'BountyCreated')
				.withArgs(bountyId, mockOrg, owner.address, expectedBountyAddress, expectedTimestamp);
		});
	});

	describe('fundBounty', () => {
		it('should revert if bounty is already closed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, 'mock-org');

			const oracleContract = openQProxy.connect(oracle);
			await oracleContract.claimBounty(bountyId, owner.address);

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			// ACT + ASSERT
			await expect(openQProxy.fundBountyToken(bountyId, mockLink.address, 10000000, 1)).to.be.revertedWith('FUNDING_CLOSED_BOUNTY');
		});

		it('should revert if funded with a non-whitelisted token', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, 'mock-org');

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await blacklistedMockDai.approve(bountyAddress, 10000000);

			// ACT + ASSERT
			await expect(openQProxy.fundBountyToken(bountyId, blacklistedMockDai.address, 10000000, 1)).to.be.revertedWith('TOKEN_NOT_ACCEPTED');
		});

		it('should set funder to msg.sender', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, 'mock-org');
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV0');
			const bounty = await Bounty.attach(bountyAddress);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			openQProxy.fundBountyToken(bountyId, mockLink.address, 100, 1);

			const depositId = generateDepositId(bountyId, 0);

			// ASSERT
			expect(await bounty.funder(depositId)).to.equal(owner.address);
		});

		it('should deposit the correct amount from sender to bounty', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, 'mock-org');
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV0');
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
			await openQProxy.fundBountyToken(bountyId, mockLink.address, value, 1);
			await openQProxy.fundBountyToken(bountyId, mockDai.address, value, 1);

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
			await openQProxy.mintBounty(bountyId, 'mock-org');
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			await mockNft.approve(bountyAddress, 1);

			// ASSUME
			expect(await mockNft.ownerOf(1)).to.equal(owner.address);

			// ACT
			await openQProxy.fundBountyNFT(bountyId, mockNft.address, 1, 1);

			// ASSERT
			expect(await mockNft.ownerOf(1)).to.equal(bountyAddress);
		});

		it('should emit a DepositReceived event with expected bountyId, bounty address, token address, funder, volume, timestamp, depositId, tokenStandard and tokenId', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, 'mock-org');

			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await mockLink.approve(bountyAddress, 10000000);

			const Bounty = await ethers.getContractFactory('BountyV0');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			const depositId = generateDepositId(bountyId, 0);
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			// ASSERT
			await expect(openQProxy.fundBountyToken(bountyId, mockLink.address, 100, 1))
				.to.emit(openQProxy, 'TokenDepositReceived')
				.withArgs(depositId, bountyAddress, bountyId, 'mock-org', mockLink.address, expectedTimestamp, owner.address, 1, 100);
		});
	});

	describe('claimBounty', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ Oracle', async () => {
				// ASSERT
				await expect(openQProxy.claimBounty(bountyId, owner.address)).to.be.revertedWith('Oraclize: caller is not the current OpenQ Oracle');
			});

			it('should revert if bounty is already closed', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ASSERT
				await expect(oracleContract.claimBounty(bountyId, owner.address)).to.be.revertedWith('CLAIMING_CLOSED_BOUNTY');
			});
		});

		describe('bounty updates after claim', () => {
			it('should close issue after successful claim', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const openBounty = await openQProxy.bountyIsOpen(bountyId);
				expect(openBounty).to.equal(true);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				const closedBounty = await openQProxy.bountyIsOpen(bountyId);
				expect(closedBounty).to.equal(false);
			});

			it('should set closer to the claimer address', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV0');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const closer = await newBounty.closer();
				expect(closer).to.equal(ethers.constants.AddressZero);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				const newCloser = await newBounty.closer();
				expect(newCloser).to.equal(owner.address);
			});

			it('should set close time correctly', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV0');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const expectedTimestamp = await setNextBlockTimestamp();

				// ASSUME
				const bountyClosedTime = await newBounty.bountyClosedTime();
				expect(bountyClosedTime).to.equal(0);

				const closer = await newBounty.closer();
				expect(closer).to.equal(ethers.constants.AddressZero);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				const newCloser = await newBounty.closer();
				expect(newCloser).to.equal(owner.address);
			});
		});

		describe('transfer', () => {
			it('should transfer all assets from bounty contract to claimer', async () => {
				// ARRANGE
				const volume = 100;
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);

				await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);
				await openQProxy.fundBountyToken(bountyId, mockDai.address, volume, 1);
				await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

				const [, claimer] = await ethers.getSigners();

				// ASSUME
				const bountyMockLinkTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				const bountyDaiTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
				const bountyProtcolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
				expect(bountyMockLinkTokenBalance).to.equal('100');
				expect(bountyDaiTokenBalance).to.equal('100');
				expect(bountyProtcolTokenBalance).to.equal('100');

				const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const claimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');
				expect(claimerFakeTokenBalance).to.equal('0');

				// // // ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, claimer.address);

				// // ASSERT
				const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
				const newBountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
				expect(newBountyMockTokenBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');
				expect(newBountyProtocolTokenBalance).to.equal('0');

				const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('100');
				expect(newClaimerFakeTokenBalance).to.equal('100');
			});

			it('should transfer all NFT assets from bounty contract to claimer', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
		});

		describe('Event Emissions', () => {
			it('should emit a BountyClosed event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT
				const oracleContract = openQProxy.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address))
					.to.emit(openQProxy, 'BountyClosed')
					.withArgs(bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp);
			});

			it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const volume = 100;

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);
				await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);
				await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

				const expectedTimestamp = await setNextBlockTimestamp();
				// ACT
				// ASSERT
				const oracleContract = openQProxy.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address))
					.to.emit(openQProxy, 'TokenBalanceClaimed')
					.withArgs(bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp, mockLink.address, volume)
					.withArgs(bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp, mockDai.address, volume)
					.withArgs(bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp, ethers.constants.AddressZero, volume);
			});
		});
	});

	describe('refundDeposits', () => {
		describe('Event Emissions', () => {
			it('should emit DepositRefunded event for refunded deposit', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV0');
				const bounty = await Bounty.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);

				const volume = 100;
				const depositedTimestamp = await setNextBlockTimestamp();
				const tokenDepositId = generateDepositId(bountyId, 0);
				await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);

				const protocolDepositId = generateDepositId(bountyId, 1);
				await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

				const expectedTimestamp = await setNextBlockTimestamp(2764800);

				// ACT
				// ASSERT
				await expect(openQProxy.refundDeposit(bountyId, protocolDepositId))
					.to.emit(openQProxy, 'DepositRefunded')
					.withArgs(protocolDepositId, bountyId, bountyAddress, 'mock-org', expectedTimestamp);

				const secondExpectedTimestamp = await setNextBlockTimestamp(2764810);

				await expect(openQProxy.refundDeposit(bountyId, tokenDepositId))
					.to.emit(openQProxy, 'DepositRefunded')
					.withArgs(tokenDepositId, bountyId, bountyAddress, 'mock-org', secondExpectedTimestamp);
			});
		});

		describe('requires and reverts', () => {
			it('should revert if attempt to withdraw too early', async () => {
				// Mint Bounty
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// Get Escrow Period
				const BountyV0 = await ethers.getContractFactory('BountyV0');
				bounty = await BountyV0.attach(bountyAddress);

				// Fund Bounty
				await mockDai.approve(bountyAddress, 100000);

				const depositId = generateDepositId(bountyId, 0);
				await openQProxy.fundBountyToken(bountyId, mockDai.address, 100000, 276000);

				// ACT / ASSERT
				await expect(openQProxy.refundDeposit(bountyId, depositId)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});

			it('should revert if not funder', async () => {
				// ARRANGE
				// Mint Bounty
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// Get Escrow Period
				const BountyV0 = await ethers.getContractFactory('BountyV0');
				bounty = await BountyV0.attach(bountyAddress);

				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(bountyId, 0);

				const escrowPeriod = await bounty.expiration(depositId);

				// ADVANCE TIME
				const thirtyTwoDays = 2765000;
				ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

				// ACT / ASSERT
				await expect(openQProxy.refundDeposit(bountyId, depositId)).to.be.revertedWith('ONLY_FUNDER_CAN_REQUEST_REFUND');
			});

			it('should revert if bounty is closed', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const depositId = generateDepositId(bountyId, 0);

				// ACT + ASSERT
				await expect(openQProxy.refundDeposit(bountyId, depositId)).to.be.revertedWith('REFUNDING_CLOSED_BOUNTY');
			});
		});

		describe('transfer', () => {
			it('should transfer refunded deposit volume from bounty contract to funder', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV0');
				const bounty = await Bounty.attach(bountyAddress);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);
				const volume = 100;

				const linkDepositId = generateDepositId(bountyId, 0);
				await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);

				const daiDepositId = generateDepositId(bountyId, 1);
				await openQProxy.fundBountyToken(bountyId, mockDai.address, volume, 1);

				const protocolDepositId = generateDepositId(bountyId, 2);
				await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

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
				await openQProxy.refundDeposit(bountyId, linkDepositId);
				await openQProxy.refundDeposit(bountyId, daiDepositId);
				await openQProxy.refundDeposit(bountyId, protocolDepositId);

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
				await openQProxy.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const Bounty = await ethers.getContractFactory('BountyV0');
				const bounty = await Bounty.attach(bountyAddress);

				await mockNft.approve(bountyAddress, 1);

				const depositId = generateDepositId(bountyId, 0);
				await openQProxy.fundBountyNFT(bountyId, mockNft.address, 1, 1);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(bountyAddress);

				// ACT
				await openQProxy.refundDeposit(bountyId, depositId);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
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