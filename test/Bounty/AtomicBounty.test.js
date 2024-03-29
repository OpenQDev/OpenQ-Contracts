/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const { Constants, atomicBountyInitOperation_fundingGoal, atomicBountyInitOperation_noFundingGoal, atomicBountyInitOperation_permissioned } = require('../constants');
const { generateDepositId, generateClaimantId } = require('../utils');

describe('AtomicBountyV1.sol', () => {
	// CONTRACT FACTORIES
	let AtomicBountyV1;
	let AtomicBountyProxy;

	// IMPLEMENTATION
	let atomicContractImplementation

	// ACCOUNTS
	let owner;
	let claimManager;
	let depositManager;

	// MOCK ASSETS
	let mockLink;
	let mockDai;

	// UTILS
	let abiCoder = new ethers.utils.AbiCoder;

	// CONSTANTS
	let closerData = abiCoder.encode(['address', 'string', 'address', 'string'], [ethers.constants.AddressZero, "FlacoJones", ethers.constants.AddressZero, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);

	// INITIALIZATION OPERATIONS
	let atomicBountyInitOperation;

	// TEST CONTRACTS
	let atomicContract;
	let atomicContract_noFundingGoal;

	// MISC
	let initializationTimestampAtomic;
	let initializationTimestampAtomicNoFundingGoal;

	beforeEach(async () => {
		AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');

		[owner, claimManager, depositManager] = await ethers.getSigners();

		// MOCK ASSETS
		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		// ATOMIC CONTRACT W/ FUNDING GOAL
		atomicContractImplementation = await AtomicBountyV1.deploy();
		await atomicContractImplementation.deployed();
		
		AtomicBountyProxy = await ethers.getContractFactory('OpenQProxy');
		let atomicContractProxy = await AtomicBountyProxy.deploy(atomicContractImplementation.address, []);
		await atomicContractProxy.deployed();
		atomicContract = await AtomicBountyV1.attach(atomicContractProxy.address);

		atomicBountyInitOperation = atomicBountyInitOperation_fundingGoal(mockLink.address)
		initializationTimestamp = await setNextBlockTimestamp();
		await atomicContract.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(atomicContract.address, 10000000);
		await mockDai.approve(atomicContract.address, 10000000);

		// ATOMIC CONTRACT W/ NO FUNDING GOAL
		let atomicContractProxy_noFundingGoal = await AtomicBountyProxy.deploy(atomicContractImplementation.address, []);
		await atomicContractProxy_noFundingGoal.deployed();
		atomicContract_noFundingGoal = await AtomicBountyV1.attach(atomicContractProxy_noFundingGoal.address);

		atomicBountyNoFundingGoalInitOperation = atomicBountyInitOperation_noFundingGoal();
		initializationTimestampAtomicNoFundingGoal = await setNextBlockTimestamp();

		await atomicContract_noFundingGoal.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, atomicBountyNoFundingGoalInitOperation);
	});

	describe('initializer', () => {
		it(`should initialize bounty with correct metadata`, async () => {
			// ARRANGE/ASSERT
			await expect(await atomicContract.bountyId()).equals(Constants.bountyId);
			await expect(await atomicContract.issuer()).equals(owner.address);
			await expect(await atomicContract.organization()).equals(Constants.organization);
			await expect(await atomicContract.status()).equals(0);
			await expect(await atomicContract.openQ()).equals(owner.address);
			await expect(await atomicContract.claimManager()).equals(claimManager.address);
			await expect(await atomicContract.depositManager()).equals(depositManager.address);
			await expect(await atomicContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await atomicContract.bountyType()).equals(Constants.ATOMIC_CONTRACT);
			await expect(await atomicContract.hasFundingGoal()).equals(true);
			await expect(await atomicContract.fundingToken()).equals(mockLink.address);
			await expect(await atomicContract.fundingGoal()).equals(100);
			await expect(await atomicContract.issuerExternalUserId()).equals(Constants.mockOpenQId);

			await expect(await atomicContract.invoiceRequired()).equals(false);
			await expect(await atomicContract.kycRequired()).equals(false);
			await expect(await atomicContract.supportingDocumentsRequired()).equals(false);
		});

		it('should revert if bountyId is empty', async () => {
			// ARRANGE
			let atomicContractProxy = await AtomicBountyProxy.deploy(atomicContractImplementation.address, []);
			await atomicContractProxy.deployed();
			let freshAtomicContract = await AtomicBountyV1.attach(atomicContractProxy.address);

			// ASSERT
			await expect(freshAtomicContract.initialize("", owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
		});

		it('should revert if organization is empty', async () => {
			// ARRANGE
			let atomicContractProxy = await AtomicBountyProxy.deploy(atomicContractImplementation.address, []);
			await atomicContractProxy.deployed();
			let freshAtomicContract = await AtomicBountyV1.attach(atomicContractProxy.address);

			// ASSERT
			await expect(freshAtomicContract.initialize(Constants.bountyId, owner.address, "", owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
		});
	});

	describe('claimBalance', () => {
		it('should transfer protocol token from contract to payout address and set token balance to zero', async () => {
			// ARRANGE
			const volume = 100;

			const [, claimer] = await ethers.getSigners();
			const initialClaimerProtocolBalance = (await atomicContract.provider.getBalance(claimer.address));

			await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, Constants.thirtyDays, { value: volume });

			const deposits = await atomicContract.getDeposits();
			const protocolDepositId = deposits[0];

			// ASSUME
			const bountyProtocolTokenBalance = (await atomicContract.provider.getBalance(atomicContract.address)).toString();
			expect(bountyProtocolTokenBalance).to.equal('100');

			const claimerProtocolBalance = (await ethers.provider.getBalance(claimer.address));

			// ACT
			await atomicContract.connect(claimManager).claimBalance(claimer.address, ethers.constants.AddressZero);

			// ASSERT
			const newBountyProtocolTokenBalance = (await atomicContract.provider.getBalance(atomicContract.address)).toString();
			const tokenBalance = (await atomicContract.provider.getBalance(atomicContract.address)).toString();
			expect(newBountyProtocolTokenBalance).to.equal('0');
			expect(tokenBalance).to.equal('0');
		});

		it('should transfer ERC20 token from contract to payout address and set token balance to zero', async () => {
			// ARRANGE
			const volume = 100;

			const [, claimer] = await ethers.getSigners();
			const initialClaimerProtocolBalance = (await atomicContract.provider.getBalance(claimer.address));

			await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, Constants.thirtyDays);
			await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, volume, Constants.thirtyDays);

			const deposits = await atomicContract.getDeposits();
			const linkDepositId = deposits[0];
			const daiDepositId = deposits[1];

			// ASSUME
			const bountyMockTokenBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
			const bountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
			expect(bountyMockTokenBalance).to.equal('100');
			expect(bountyFakeTokenBalance).to.equal('100');

			const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
			const claimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
			expect(claimerMockTokenBalance).to.equal('0');
			expect(claimerFakeTokenBalance).to.equal('0');

			// ACT
			await atomicContract.connect(claimManager).claimBalance(claimer.address, mockLink.address);
			await atomicContract.connect(claimManager).claimBalance(claimer.address, mockDai.address);

			// ASSERT
			const newBountyMockLinkBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
			const newBountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
			expect(newBountyMockLinkBalance).to.equal('0');
			expect(newBountyFakeTokenBalance).to.equal('0');

			const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
			const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('100');
			expect(newClaimerFakeTokenBalance).to.equal('100');
		});

		it('should revert if not called by claim manager', async () => {
			// ACT/ASSERT
			await expect(atomicContract.claimBalance(owner.address, mockLink.address)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
		});
	});

	describe('close', () => {
		it('should revert if not called by ClaimManager contract', async () => {
			// ARRANGE
			const [, , , , , notClaimManager] = await ethers.getSigners();

			// ASSERT
			await expect(atomicContract.connect(notClaimManager).close(owner.address, closerData)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
		});

		it('should revert if already closed', async () => {
			// ARRANGE
			atomicContract.connect(claimManager).close(owner.address, closerData);
			//ACT / ASSERT
			await expect(atomicContract.connect(claimManager).close(owner.address, closerData)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should change status to CLOSED (1)', async () => {
			// ASSUME
			await expect(await atomicContract.status()).equals(0);
			//ACT
			await atomicContract.connect(claimManager).close(owner.address, closerData);
			// ASSERT
			await expect(await atomicContract.status()).equals(1);
		});

		it('should set closer to payout address', async () => {
			// ASSUME
			await expect(await atomicContract.closer()).equals(ethers.constants.AddressZero);
			//ACT
			await atomicContract.connect(claimManager).close(owner.address, closerData);
			// ASSERT
			await expect(await atomicContract.closer()).equals(owner.address);
		});

		it('should set bountyClosedTime to the block timestamp', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();
			// ASSUME
			await expect(await atomicContract.bountyClosedTime()).equals(0);
			//ACT
			await atomicContract.connect(claimManager).close(owner.address, closerData);
			// ASSERT
			await expect(await atomicContract.bountyClosedTime()).equals(expectedTimestamp);
		});
	});

	describe('setInvoiceComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			let setInvoiceCompleteData = abiCoder.encode(["bool"], [true]);

			// ASSERT
			await expect(atomicContract.connect(notOwner).setInvoiceComplete(setInvoiceCompleteData)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set invoiceComplete for given tier', async () => {
			// ASSUME
			expect(await atomicContract.invoiceComplete()).to.equal(false)
			
			let setInvoiceCompleteData = abiCoder.encode(["bool"], [true]);

			// ACT
			await atomicContract.setInvoiceComplete(setInvoiceCompleteData);

			// ASSERT
			expect(await atomicContract.invoiceComplete()).to.equal(true)
		})
	})

	describe('setSupportingDocumentsComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			let setSupportingDocumentsCompleteData = abiCoder.encode(["bool"], [true]);

			// ASSERT
			await expect(atomicContract.connect(notOwner).setSupportingDocumentsComplete(setSupportingDocumentsCompleteData)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocumentsComplete', async () => {
			let setSupportingDocumentsCompleteData = abiCoder.encode(["bool"], [true]);

			// ASSUME
			expect(await atomicContract.supportingDocumentsComplete()).to.equal(false)
			
			// ACT
			await atomicContract.setSupportingDocumentsComplete(setSupportingDocumentsCompleteData);

			// ASSERT
			expect(await atomicContract.supportingDocumentsComplete()).to.equal(true)
		})
	})

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