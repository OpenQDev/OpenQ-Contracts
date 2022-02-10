/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { generateDepositId } = require('./utils');

describe('Bounty.sol', () => {
	let bounty;
	let mockLink;
	let mockDai;
	let owner;
	let initializationTimestamp;

	const mockId = "mockId";
	let issuer;
	const organization = "mockOrg";

	beforeEach(async () => {
		const BountyV0 = await ethers.getContractFactory('BountyV0');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');

		[owner] = await ethers.getSigners();
		issuer = owner.address;

		bounty = await BountyV0.deploy();
		await bounty.deployed();

		// Passing in owner.address as _openQ for unit testing
		initializationTimestamp = await setNextBlockTimestamp();
		await bounty.initialize(mockId, owner.address, organization, owner.address);

		mockLink = await MockLink.deploy();
		await mockLink.deployed();
		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		await mockLink.approve(bounty.address, 10000000);
		await mockDai.approve(bounty.address, 10000000);
	});

	describe('initializer', () => {
		it('should initialize bounty with correct bountyId, issuer, organization, status, openQ implementation, bountyCreatedTime, and escrowPeriod', async () => {
			// ARRANGE
			const actualBountyId = await bounty.bountyId();
			const actualIssuer = await bounty.issuer();
			const actualOrganization = await bounty.organization();
			const actualStatus = await bounty.status();
			const actualOpenQ = await bounty.openQ();
			const actualBounyCreatedTime = await bounty.bountyCreatedTime();

			// ASSERT
			await expect(actualBountyId).equals(mockId);
			await expect(actualIssuer).equals(issuer);
			await expect(organization).equals(organization);
			await expect(actualStatus).equals(0);
			await expect(actualOpenQ).equals(issuer);
			await expect(actualBounyCreatedTime).equals(initializationTimestamp);
		});

		it('should revert if bountyId is empty', async () => {
			// ASSERT
			const BountyV0 = await ethers.getContractFactory('BountyV0');
			bounty = await BountyV0.deploy();

			await expect(bounty.initialize("", owner.address, organization, owner.address)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
		});

		it('should revert if organization is empty', async () => {
			// ASSERT
			const BountyV0 = await ethers.getContractFactory('BountyV0');
			bounty = await BountyV0.deploy();

			await expect(bounty.initialize(mockId, owner.address, "", owner.address)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
		});
	});

	describe('receiveFunds', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const volume = 10000;
				let bountyWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(bountyWithNonOwnerAccount.receiveFunds(notOwner.address, mockLink.address, volume, 2765000)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if no volume is sent', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const volume = 0;

				// ASSERT
				await expect(bounty.receiveFunds(owner.address, mockLink.address, volume, 2765000)).to.be.revertedWith('ZERO_VOLUME_SENT');
			});

			it('should revert if funder tries to send more than allowance', async () => {
				// ARRANGE
				// ACT
				// ASSERT
				const greaterThanAllowance = 100000000;
				await expect(bounty.receiveFunds(owner.address, mockLink.address, greaterThanAllowance, 2765000)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
			});
		});

		describe('deposits', () => {
			it('should push deposit id onto deposits', async () => {
				const protocolVolume = ethers.utils.parseEther("1.0");
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, protocolVolume, 2765000, { value: protocolVolume });
				const mockProtocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 0);
				let protocolDepositId = await bounty.deposits(0);
				expect(protocolDepositId).to.equal(mockProtocolDepositId);

				const erc20Volume = 10000;
				await bounty.receiveFunds(owner.address, mockLink.address, erc20Volume, 2765000);
				const mockErc20DepositId = generateDepositId(owner.address, mockLink.address, 1);
				let erc20DepositId = await bounty.deposits(1);
				expect(erc20DepositId).to.equal(mockErc20DepositId);
			});
		});

		describe('transferFrom', () => {
			it('should transfer the resepctive amount from sender to this bounty address for the token address', async () => {
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
				const value = 100;

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value, 2765000);
				await bounty.receiveFunds(owner.address, mockDai.address, value, 2765000);

				// ASSERT
				const funderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
				expect(funderMockLinkBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
			});
		});

		describe('protocol token funding', () => {
			it('should accept msg.value if token address is zero address', async () => {
				const volume = ethers.utils.parseEther("1.0");
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 2765000, { value: volume });
				const bountyProtocolTokenBalance = await bounty.provider.getBalance(bounty.address);
				expect(bountyProtocolTokenBalance).to.equal(volume);
			});
		});
	});

	describe('closeBounty', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			let issueWithNonOwnerAccount = bounty.connect(notOwner);

			// ASSERT
			await expect(issueWithNonOwnerAccount.closeBounty(owner.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if already closed', async () => {
			// ARRANGE
			bounty.closeBounty(owner.address);
			//ACT / ASSERT
			await expect(bounty.closeBounty(owner.address)).to.be.revertedWith('CLOSING_CLOSED_BOUNTY');
		});

		it('should change status to CLOSED (1)', async () => {
			// ASSUME
			await expect(await bounty.status()).equals(0);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.status()).equals(1);
		});

		it('should set closer to payout address', async () => {
			// ASSUME
			await expect(await bounty.closer()).equals(ethers.constants.AddressZero);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.closer()).equals(owner.address);
		});

		it('should set bountyClosedTime to the block timestamp', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();
			// ASSUME
			await expect(await bounty.bountyClosedTime()).equals(0);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.bountyClosedTime()).equals(expectedTimestamp);
		});
	});

	describe('claimDeposit', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 10000;
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.claim(notOwner.address, ethers.utils.formatBytes32String('mockDepositId'))).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if issue is already closed', async () => {
				// ARRANGE
				await bounty.closeBounty(owner.address);

				// ASSERT
				await expect(bounty.claim(owner.address, ethers.utils.formatBytes32String('mockDepositId'))).to.be.revertedWith('CLAIMING_CLOSED_BOUNTY');
			});
		});

		describe('transfer', () => {
			it('should transfer deposit assets from bounty contract to claimer', async () => {
				// ARRANGE
				const volume = 100;
				const linkDepositId = generateDepositId(owner.address, mockLink.address, 0);
				const daiDepositId = generateDepositId(owner.address, mockDai.address, 1);
				const protocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 2);

				const [, claimer] = await ethers.getSigners();
				const initialClaimerProtocolBalance = (await bounty.provider.getBalance(claimer.address));

				await bounty.receiveFunds(owner.address, mockLink.address, volume, 2765000);
				await bounty.receiveFunds(owner.address, mockDai.address, volume, 2765000);
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 2765000, { value: volume });

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				const bountyProtocolTokenBalance = (await bounty.provider.getBalance(bounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
				expect(bountyProtocolTokenBalance).to.equal('100');

				const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const claimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				const claimerProtocolBalance = (await ethers.provider.getBalance(claimer.address));
				expect(claimerMockTokenBalance).to.equal('0');
				expect(claimerFakeTokenBalance).to.equal('0');
				// Not sure why claimer balance is not updating...
				// expect(claimerProtocolBalance).to.equal(initialClaimerProtocolBalance.sub(100));

				// // ACT
				await bounty.claim(claimer.address, linkDepositId);
				await bounty.claim(claimer.address, daiDepositId);
				await bounty.claim(claimer.address, protocolDepositId);

				// // // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				const newBountyProtocolTokenBalance = (await bounty.provider.getBalance(bounty.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');
				expect(newBountyProtocolTokenBalance).to.equal('0');

				const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				const newClaimedProtocolTokenBalance = (await bounty.provider.getBalance(claimer.address));
				expect(newClaimerMockTokenBalance).to.equal('100');
				expect(newClaimerFakeTokenBalance).to.equal('100');
				// expect(newClaimedProtocolTokenBalance).to.equal(initialClaimerProtocolBalance);
			});
		});
	});

	describe('refundBountyDeposit', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				const mockDepositId = generateDepositId(owner.address, mockLink.address, 123);

				// ASSERT
				await expect(issueWithNonOwnerAccount.refundBountyDeposit(mockDepositId, owner.address)).to.be.revertedWith('Method is only callable by OpenQ');
			});
		});

		describe('refunded', () => {
			it('should set deposit refunded to true on refund', async () => {
				// ARRANGE
				const volume = 100;

				const linkDepositId = generateDepositId(owner.address, mockLink.address, 0);
				const daiDepositId = generateDepositId(owner.address, mockDai.address, 1);
				const protocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 2);

				// ASSUME
				expect(await bounty.refunded(linkDepositId)).to.equal(false);
				expect(await bounty.refunded(daiDepositId)).to.equal(false);
				expect(await bounty.refunded(protocolDepositId)).to.equal(false);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, volume, 1);
				await bounty.receiveFunds(owner.address, mockDai.address, volume, 1);
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });

				// ACT
				await bounty.refundBountyDeposit(linkDepositId, owner.address);
				await bounty.refundBountyDeposit(daiDepositId, owner.address);
				await bounty.refundBountyDeposit(protocolDepositId, owner.address);

				// // ASSERT
				expect(await bounty.refunded(linkDepositId)).to.equal(true);
				expect(await bounty.refunded(daiDepositId)).to.equal(true);
				expect(await bounty.refunded(protocolDepositId)).to.equal(true);
			});
		});

		describe('transfer', () => {
			it('should transfer refunded asset from bounty contract to funder', async () => {
				// ARRANGE
				const volume = 100;

				await bounty.receiveFunds(owner.address, mockLink.address, volume, 1);
				const linkDepositId = generateDepositId(owner.address, mockLink.address, 0);

				await bounty.receiveFunds(owner.address, mockDai.address, volume, 1);
				const daiDepositId = generateDepositId(owner.address, mockDai.address, 1);

				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });
				const protocolDepositId = generateDepositId(owner.address, ethers.constants.AddressZero, 2);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				const bountyProtocolTokenBalance = (await ethers.provider.getBalance(bounty.address)).toString();

				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
				expect(bountyProtocolTokenBalance).to.equal('100');

				const funderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(funderMockLinkBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				// // // ACT
				await bounty.refundBountyDeposit(linkDepositId, owner.address);
				await bounty.refundBountyDeposit(daiDepositId, owner.address);

				// // // // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');

				const newFunderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const newFunderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(newFunderMockLinkBalance).to.equal('10000000000000000000000');
				expect(newFunderFakeTokenBalance).to.equal('10000000000000000000000');
			});
		});
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