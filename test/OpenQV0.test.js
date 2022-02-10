/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers, upgrades } = require("hardhat");
const { generateDepositId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe.only('OpenQV0.sol', () => {
	let openQ;
	let owner;
	let mockLink;
	let mockDai;
	let bountyId = 'mockIssueId';
	let oracle;

	beforeEach(async () => {
		const OpenQStorage = await ethers.getContractFactory('OpenQStorage');
		const OpenQ = await ethers.getContractFactory('OpenQV0');
		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');

		[owner, , oracle] = await ethers.getSigners();

		openQ = await upgrades.deployProxy(OpenQ, [oracle.address], { kind: 'uups' });
		await openQ.deployed();

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();

		bountyFactory = await BountyFactory.deploy();
		await bountyFactory.deployed();

		await openQ.setOpenQStorage(openQStorage.address);
		await openQ.setBountyFactory(bountyFactory.address);
		await openQ.transferOracle(oracle.address);
	});

	describe('mintBounty', () => {

		it('should deploy a new bounty contract with expected initial metadata', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			await openQ.mintBounty(bountyId, 'mock-org');

			const bountyIsOpen = await openQ.bountyIsOpen(bountyId);
			const bountyAddress = await openQ.bountyIdToAddress(bountyId);

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
			await openQ.mintBounty(bountyId, 'mock-org');

			// ASSERT
			await expect(openQ.mintBounty(bountyId, 'mock-org')).to.be.revertedWith('ERC1167: create2 failed');
		});

		it('should store bountyId to bountyAddress', async () => {
			// ACT
			await openQ.mintBounty(bountyId, 'mock-org');

			const bountyIsOpen = await openQ.bountyIsOpen(bountyId);
			const bountyAddress = await openQ.bountyIdToAddress(bountyId);

			const Bounty = await ethers.getContractFactory('BountyV0');

			const newBounty = await Bounty.attach(
				bountyAddress
			);

			const newBountyId = await newBounty.bountyId();

			const bountyIdFromAddress = await openQ.bountyAddressToBountyId(bountyAddress);
			expect(bountyIdFromAddress).to.equal(newBountyId);

			const bountyAddressFromId = await openQ.bountyIdToAddress(newBountyId);
			expect(bountyAddressFromId).to.equal(bountyAddress);
		});

		it('should emit a BountyCreated event with expected bounty id, issuer address, bounty address, and bountyMintTime', async () => {
			// ARRANGE
			const mockOrg = "OpenQDev";
			const expectedBountyAddress = await openQ.bountyIdToAddress(bountyId);

			const expectedTimestamp = await setNextBlockTimestamp();

			// ACT
			// ASSERT
			await expect(openQ.mintBounty(bountyId, mockOrg))
				.to.emit(openQ, 'BountyCreated')
				.withArgs(bountyId, mockOrg, owner.address, expectedBountyAddress, expectedTimestamp);
		});
	});

	describe('fundBounty', () => {
		it('should revert if bounty is already closed', async () => {
			// ARRANGE
			await openQ.mintBounty(bountyId, 'mock-org');

			const oracleContract = openQ.connect(oracle);
			await oracleContract.claimBounty(bountyId, owner.address);

			const bountyAddress = await openQ.bountyIdToAddress(bountyId);

			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			// ACT + ASSERT
			await expect(openQ.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1)).to.be.revertedWith('FUNDING_CLOSED_BOUNTY');
		});

		it('should deposit the correct amount from sender to bounty', async () => {
			// ARRANGE
			await openQ.mintBounty(bountyId, 'mock-org');
			const bountyAddress = await openQ.bountyIdToAddress(bountyId);
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
			await openQ.fundBountyToken(bountyAddress, mockLink.address, value, 1);
			await openQ.fundBountyToken(bountyAddress, mockDai.address, value, 1);

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

		it('should emit a DepositReceived event with expected bountyId, bounty address, token address, funder, volume, timestamp, depositId, tokenStandard and tokenId', async () => {
			// ARRANGE
			await openQ.mintBounty(bountyId, 'mock-org');

			const bountyAddress = await openQ.bountyIdToAddress(bountyId);

			await mockLink.approve(bountyAddress, 10000000);

			const Bounty = await ethers.getContractFactory('BountyV0');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			const expectedTimestamp = await setNextBlockTimestamp();
			const depositId = generateDepositId(owner.address, mockLink.address, 0);

			// ACT
			// ASSERT
			await expect(openQ.fundBountyToken(bountyAddress, mockLink.address, 100, 1))
				.to.emit(openQ, 'TokenDepositReceived')
				.withArgs(depositId, bountyAddress, bountyId, 'mock-org', mockLink.address, expectedTimestamp, owner.address, 1, 100);
		});
	});

	describe('claimBounty', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ Oracle', async () => {
				// ARRANGE
				const closer = '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690';

				// ASSERT
				await expect(openQ.claimBounty(bountyId, closer)).to.be.revertedWith('Oraclize: caller is not the current OpenQ Oracle');
			});

			it('should revert if bounty is already closed', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');
				const oracleContract = openQ.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);
				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				// ASSERT
				await expect(oracleContract.claimBounty(bountyId, owner.address)).to.be.revertedWith('CLAIMING_CLOSED_BOUNTY');
			});
		});

		describe('bounty updates after claim', () => {
			it('should close issue after successful claim', async () => {
				// ARRANGE
				// ASSUME
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				const openBounty = await openQ.bountyIsOpen(bountyId);
				expect(openBounty).to.equal(true);

				// ACT
				const oracleContract = openQ.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				const closedBounty = await openQ.bountyIsOpen(bountyId);
				expect(closedBounty).to.equal(false);
			});

			it('should set closer to the claimer address', async () => {
				// ARRANGE
				// ASSUME
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV0');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const closer = await newBounty.closer();
				expect(closer).to.equal(ethers.constants.AddressZero);

				// ACT
				const oracleContract = openQ.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				// ASSERT
				const newCloser = await newBounty.closer();
				expect(newCloser).to.equal(owner.address);
			});

			it('should set close time correctly', async () => {
				// ARRANGE
				// ASSUME
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

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
				const oracleContract = openQ.connect(oracle);
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
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);

				await openQ.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
				await openQ.fundBountyToken(bountyAddress, mockDai.address, volume, 1);
				await openQ.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

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
				const oracleContract = openQ.connect(oracle);
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
		});

		describe('Event Emissions', () => {
			it('should emit a DepositClaimed event with proper bounty id, bounty Address, tokenAddress, payout address, value, and bounty closed time', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);

				const expectedTimestamp = await setNextBlockTimestamp();

				const volume = 100;
				await openQ.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
				await openQ.fundBountyToken(bountyAddress, mockDai.address, volume, 1);
				await openQ.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

				const mockLinkDepositId = generateDepositId(owner.address, mockLink.address, 0);

				// ACT
				// ASSERT
				// Since the DepositClaimed time stamp happens in a for loop, its hard to predict to the ms what it will be
				// Usually add + 2 works....
				const oracleContract = openQ.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address))
					.to.emit(openQ, 'DepositClaimed')
					.withArgs(mockLinkDepositId, bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp + 2);
			});

			it('should emit a BountyClosed event with proper bounty id, bounty Address, payout address, and bounty closed time', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);

				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT
				const oracleContract = openQ.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address))
					.to.emit(openQ, 'BountyClosed')
					.withArgs(bountyId, bountyAddress, 'mock-org', owner.address, expectedTimestamp);
			});
		});
	});

	describe('refundBountyDeposits', () => {
		describe('Event Emissions', () => {
			it('should emit DepositRefunded event for refunded deposit', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);

				const volume = 100;
				const depositedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(owner.address, mockLink.address, 0);
				await openQ.fundBountyToken(bountyAddress, mockLink.address, volume, 1);

				const protocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 1);
				await openQ.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

				const expectedTimestamp = await setNextBlockTimestamp(2764800);

				// ACT
				// ASSERT
				await expect(openQ.refundBountyDeposit(bountyAddress, depositId))
					.to.emit(openQ, 'DepositRefunded')
					.withArgs(depositId, bountyId, bountyAddress, 'mock-org', expectedTimestamp);

				const secondExpectedTimestamp = await setNextBlockTimestamp(2764810);

				await expect(openQ.refundBountyDeposit(bountyAddress, protocolDepositId))
					.to.emit(openQ, 'DepositRefunded')
					.withArgs(protocolDepositId, bountyId, bountyAddress, 'mock-org', secondExpectedTimestamp);
			});
		});

		describe('requires and reverts', () => {
			it('should revert if attempt to withdraw too early', async () => {
				// Mint Bounty
				await openQ.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				// Get Escrow Period
				const BountyV0 = await ethers.getContractFactory('BountyV0');
				bounty = await BountyV0.attach(bountyAddress);

				// Fund Bounty
				await mockDai.approve(bountyAddress, 100000);

				const depositId = generateDepositId(owner.address, mockDai.address, 0);
				await openQ.fundBountyToken(bountyAddress, mockDai.address, 100000, 1);

				// ACT / ASSERT
				await expect(openQ.refundBountyDeposit(bountyAddress, depositId)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});

			it('should revert if not funder', async () => {
				// ARRANGE
				// Mint Bounty
				await openQ.mintBounty(bountyId, 'mock-org');
				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				// Get Escrow Period
				const BountyV0 = await ethers.getContractFactory('BountyV0');
				bounty = await BountyV0.attach(bountyAddress);

				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(owner.address, mockDai.address, 0);

				const escrowPeriod = await bounty.expiration(depositId);

				// ADVANCE TIME
				const thirtyTwoDays = 2765000;
				ethers.provider.send("evm_increaseTime", [thirtyTwoDays]);

				// ACT / ASSERT
				await expect(openQ.refundBountyDeposit(bountyAddress, depositId)).to.be.revertedWith('ONLY_FUNDERS_CAN_REQUEST_REFUND');
			});

			it('should revert if bounty is closed', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');
				const oracleContract = openQ.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address);

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				const depositId = generateDepositId(owner.address, mockDai.address, 0);

				// ACT + ASSERT
				await expect(openQ.refundBountyDeposit(bountyAddress, depositId)).to.be.revertedWith('REFUNDING_CLOSED_BOUNTY');
			});
		});

		describe('transfer', () => {
			it.only('should transfer refunded deposit volume from bounty contract to funder', async () => {
				// ARRANGE
				await openQ.mintBounty(bountyId, 'mock-org');

				const bountyAddress = await openQ.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);
				await mockDai.approve(bountyAddress, 10000000);
				const volume = 100;

				const linkDepositId = generateDepositId(owner.address, mockLink.address, 0);
				await openQ.fundBountyToken(bountyAddress, mockLink.address, volume, 1);

				const daiDepositId = generateDepositId(owner.address, mockDai.address, 1);
				await openQ.fundBountyToken(bountyAddress, mockDai.address, volume, 1);

				const protocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 2);
				await openQ.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

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

				// ACT
				await openQ.refundBountyDeposit(bountyAddress, linkDepositId);
				await openQ.refundBountyDeposit(bountyAddress, daiDepositId);
				await openQ.refundBountyDeposit(bountyAddress, protocolDepositId);

				// // // ASSERT
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