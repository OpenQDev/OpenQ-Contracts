/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const { generateDepositId, generateClaimantId } = require('../utils');

const { 
	Constants, 
	tieredFixedBountyInitOperationBuilder,
	setInvoiceCompleteData_tiered,
	setSupportingDocumentsComplete_tiered,
	setInvoiceCompleteData_atomic,
	setSupportingDocumentsComplete_atomic,
	tieredFixedBountyInitOperationBuilder_permissionless
} = require('../constants');

describe('TieredBountyCore.sol', () => {
	// CONTRACT FACTORIES
	let TieredFixedBountyV1;

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
	let tieredFixedBountyInitOperation;

	// TEST CONTRACTS
	let tieredFixedContract;

	// MISC
	let initializationTimestampTiered;

	beforeEach(async () => {
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');

		[owner, claimManager, depositManager] = await ethers.getSigners();

		// MOCK ASSETS
		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		// TIERED BOUNTY
		tieredFixedContract = await TieredFixedBountyV1.deploy();
		await tieredFixedContract.deployed();

		tieredFixedBountyInitOperation = tieredFixedBountyInitOperationBuilder_permissionless(mockLink.address)

		initializationTimestampTiered = await setNextBlockTimestamp();
		await tieredFixedContract.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredFixedContract.address, 10000000);
		await mockDai.approve(tieredFixedContract.address, 10000000);
	});

	describe('setTierWinner', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setTierWinner(Constants.mockOpenQId, 0)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set tier winner', async () => {
			// ACT
			await tieredFixedContract.setTierWinner(Constants.mockOpenQId, 0)
			await tieredFixedContract.setTierWinner(Constants.mockOpenQId+"2", 1)

			// ASSERT
			const winner = await tieredFixedContract.tierWinners(0)
			const winner2 = await tieredFixedContract.tierWinners(1)
			expect(winner).to.equal(Constants.mockOpenQId)
			expect(winner2).to.equal(Constants.mockOpenQId+"2")
		})
	})

	describe('setInvoiceComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			
			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setInvoiceComplete(setInvoiceCompleteData_tiered(0, true))).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set invoiceComplete for given tier', async () => {
			// ASSUME
			expect(await tieredFixedContract.invoiceComplete(0)).to.equal(false)
			expect(await tieredFixedContract.invoiceComplete(1)).to.equal(false)
			
			// ACT
			await tieredFixedContract.setInvoiceComplete(setInvoiceCompleteData_tiered(0, true));
			await tieredFixedContract.setInvoiceComplete(setInvoiceCompleteData_tiered(1, true));

			// ASSERT
			expect(await tieredFixedContract.invoiceComplete(0)).to.equal(true)
			expect(await tieredFixedContract.invoiceComplete(1)).to.equal(true)
		})
	})

	describe('setSupportingDocumentsComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setSupportingDocumentsComplete(setSupportingDocumentsComplete_tiered(0, true))).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocumentsComplete', async () => {
			// ASSUME
			expect(await tieredFixedContract.supportingDocumentsComplete(0)).to.equal(false)
			expect(await tieredFixedContract.supportingDocumentsComplete(1)).to.equal(false)
			
			// ACT
			await tieredFixedContract.setSupportingDocumentsComplete(setSupportingDocumentsComplete_tiered(0, true));
			await tieredFixedContract.setSupportingDocumentsComplete(setSupportingDocumentsComplete_tiered(1, true));

			// ASSERT
			expect(await tieredFixedContract.supportingDocumentsComplete(0)).to.equal(true)
			expect(await tieredFixedContract.supportingDocumentsComplete(1)).to.equal(true)
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