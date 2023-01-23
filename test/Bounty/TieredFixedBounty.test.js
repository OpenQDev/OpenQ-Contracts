/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const Constants = require('../constants');
const { generateDepositId, generateClaimantId } = require('../utils');

describe('TieredFixedBountyV1.sol', () => {
	// CONTRACT FACTORIES
	let TieredFixedBountyV1;

	// ACCOUNTS
	let owner;
	let claimManager;
	let depositManager;

	// MOCK ASSETS
	let mockLink;
	let mockDai;
	let mockNft;

	// UTILS
	let abiCoder = new ethers.utils.AbiCoder;

	// CONSTANTS
	let closerData = abiCoder.encode(['address', 'string', 'address', 'string'], [ethers.constants.AddressZero, "FlacoJones", ethers.constants.AddressZero, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
	

	// INITIALIZATION OPERATIONS
	let tieredFixedBountyInitOperation;

	// TEST CONTRACTS
	let tieredFixedContract;
	let tieredFixedContract_noFundingGoal;

	// MISC
	let initializationTimestampTiered;

	beforeEach(async () => {
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');

		[owner, claimManager, depositManager] = await ethers.getSigners();

		// MOCK ASSETS
		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		mockNft = await MockNft.deploy();
		await mockNft.deployed();

		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);
		await mockNft.safeMint(owner.address);

		// TIERED BOUNTY
		tieredFixedContract = await TieredFixedBountyV1.deploy();
		await tieredFixedContract.deployed();

		// TIERED BOUNTY No FUNDING GOAL
		tieredFixedContract_noFundingGoal = await TieredFixedBountyV1.deploy();
		await tieredFixedContract_noFundingGoal.deployed();

		const abiEncodedParamsTieredFixedBounty = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[80, 20], true, mockLink.address, '100', true, true, true, Constants.mockOpenQId, "", ""]);
		const abiEncodedParamsTieredFixedBounty_noFundingGoal = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[80, 20], false, ethers.constants.AddressZero, '0', true, true, true, Constants.mockOpenQId, "", ""]);

		tieredFixedBountyInitOperation = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];
		tieredBountyInitOperation_noFundingGoal = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty_noFundingGoal];

		initializationTimestampTiered = await setNextBlockTimestamp();
		await tieredFixedContract.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation);

		await tieredFixedContract_noFundingGoal.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, tieredBountyInitOperation_noFundingGoal);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredFixedContract.address, 10000000);
		await mockDai.approve(tieredFixedContract.address, 10000000);
		
		await mockNft.approve(tieredFixedContract.address, 0);
		await mockNft.approve(tieredFixedContract.address, 1);
		await mockNft.approve(tieredFixedContract.address, 2);
	});

	describe('initializer', () => {
		it('should revert if bountyId is empty', async () => {
			// ARRANGE
			const TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');
			tieredFixedContract = await TieredFixedBountyV1.deploy();

			// ASSERT
			await expect(tieredFixedContract.initialize("", owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
		});

		it('should revert if organization is empty', async () => {
			// ARRANGE
			const TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');
			tieredFixedContract = await TieredFixedBountyV1.deploy();

			// ASSERT
			await expect(tieredFixedContract.initialize(Constants.bountyId, owner.address, "", owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
		});

		it('should init with tiered correct metadata', async () => {
			const actualBountyPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());


			await expect(await tieredFixedContract.bountyId()).equals(Constants.bountyId);
			await expect(await tieredFixedContract.issuer()).equals(owner.address);
			await expect(await tieredFixedContract.organization()).equals(Constants.organization);
			await expect(await tieredFixedContract.status()).equals(0);
			await expect(await tieredFixedContract.openQ()).equals(owner.address);
			await expect(await tieredFixedContract.claimManager()).equals(claimManager.address);
			await expect(await tieredFixedContract.depositManager()).equals(depositManager.address);
			await expect(await tieredFixedContract.bountyCreatedTime()).equals(initializationTimestampTiered);
			await expect(await tieredFixedContract.bountyType()).equals(Constants.TIERED_FIXED_CONTRACT);
			await expect(await tieredFixedContract.hasFundingGoal()).equals(true);
			await expect(await tieredFixedContract.fundingToken()).equals(mockLink.address);
			await expect(await tieredFixedContract.fundingGoal()).equals(100);
			await expect(payoutToString[0]).equals("80");
			await expect(payoutToString[1]).equals("20");
			await expect(await tieredFixedContract.invoiceRequired()).equals(true);
			await expect(await tieredFixedContract.kycRequired()).equals(true);
			await expect(await tieredFixedContract.issuerExternalUserId()).equals(Constants.mockOpenQId);
			await expect(await tieredFixedContract.supportingDocumentsRequired()).equals(true);

			await expect(await tieredFixedContract.invoiceComplete(0)).equals(false);
			await expect(await tieredFixedContract.supportingDocumentsComplete(0)).equals(false);
		});
	});

	describe('claimTieredFixed', () => {
		it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
			// ARRANGE
			const volume = 1000;

			const [, firstPlace, secondPlace] = await ethers.getSigners();

			await tieredFixedContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, Constants.thirtyDays);

			const deposits = await tieredFixedContract.getDeposits();
			const linkDepositId = deposits[0];

			// // ASSUME
			const bountyMockTokenBalance = (await mockLink.balanceOf(tieredFixedContract.address)).toString();
			expect(bountyMockTokenBalance).to.equal('1000');

			const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
			expect(claimerMockTokenBalance).to.equal('0');

			// ACT
			await tieredFixedContract.connect(claimManager).claimTieredFixed(firstPlace.address, 0);

			// ASSERT
			const newClaimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('80');

			// ACT
			await tieredFixedContract.connect(claimManager).claimTieredFixed(secondPlace.address, 1)

			// ASSERT
			const secondPlaceMockTokenBalance = (await mockLink.balanceOf(secondPlace.address)).toString();
			expect(secondPlaceMockTokenBalance).to.equal('20');
		});

		it('should revert if not called by claim manager', async () => {
			// ACT/ASSERT
			await expect(tieredFixedContract.claimTieredFixed(owner.address, 0)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
		});
	});

	describe('closeCompetition', () => {
		it('should set bounty status to 1 and set bountyClosedTime', async () => {
			// ASSUME
			let status = await tieredFixedContract.status();
			let bountyClosedTime = await tieredFixedContract.bountyClosedTime();

			expect(status).to.equal(0);
			expect(bountyClosedTime).to.equal(0);

			const expectedTimestamp = await setNextBlockTimestamp();
			// ACT
			await tieredFixedContract.connect(claimManager).closeCompetition();

			// ASSERT
			status = await tieredFixedContract.status();
			bountyClosedTime = await tieredFixedContract.bountyClosedTime();

			expect(status).to.equal(1);
			expect(bountyClosedTime).to.equal(expectedTimestamp);
		});

		it('should revert if already closed', async () => {
			await tieredFixedContract.connect(claimManager).closeCompetition();
			await expect(tieredFixedContract.connect(claimManager).closeCompetition()).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});
	});

	describe('setPayoutSchedule', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setPayoutScheduleFixed([80, 20], mockLink.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if payoutschedule doesnt add to 100', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setPayoutScheduleFixed([100, 20], mockLink.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set payout schedule', async () => {
			// ASSUME
			let initialPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			let payoutToString = initialPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('80');
			expect(payoutToString[1]).to.equal('20');

			// ACT
			await tieredFixedContract.setPayoutScheduleFixed([70, 20, 10], mockLink.address);

			// ASSERT
			let expectedPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			payoutToString = expectedPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('70');
			expect(payoutToString[1]).to.equal('20');
			expect(payoutToString[2]).to.equal('10');
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