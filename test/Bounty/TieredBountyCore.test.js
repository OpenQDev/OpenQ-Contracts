/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const Constants = require('../constants');
const { generateDepositId, generateClaimantId } = require('../utils');

describe.only('TieredBountyCore.sol', () => {
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
	const thirtyDays = 2765000;

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
		await mockNft.approve(tieredFixedContract.address, 3);
		await mockNft.approve(tieredFixedContract.address, 4);
	});

	describe('receiveNFT', () => {
		let tierData = abiCoder.encode(['uint256'], ['0']);

		describe('REVERTS', () => {
			it('should revert if too many NFT deposits', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
				expect(await mockNft.ownerOf(2)).to.equal(owner.address);
				expect(await mockNft.ownerOf(3)).to.equal(owner.address);
				expect(await mockNft.ownerOf(4)).to.equal(owner.address);

				// ACT
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, tierData);
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, tierData);
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 2, 1, tierData);
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 3, 1, tierData);
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 4, 1, tierData);
				
				// ASSERT
				await expect(tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 5, 1, tierData)).to.be.revertedWith('NFT_DEPOSIT_LIMIT_REACHED');
			});

			it('should revert if expiration is negative', async () => {
				await expect(tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 0, tierData)).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});
		});

		describe('DEPOSIT INITIALIZATION', () => {
			it(`should initialize nft deposit data with correct metadata`, async () => {

				// ACT
				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(Constants.bountyId, 0);
				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, thirtyDays, tierData);

				// ASSERT
				expect(await tieredFixedContract.funder(depositId)).to.equal(owner.address);
				expect(await tieredFixedContract.tokenAddress(depositId)).to.equal(mockNft.address);
				expect(await tieredFixedContract.tokenId(depositId)).to.equal(1);
				expect(await tieredFixedContract.expiration(depositId)).to.equal(thirtyDays);
				expect(await tieredFixedContract.isNFT(depositId)).to.equal(true);

				const depositTime = await tieredFixedContract.depositTime(depositId);
				expect(depositTime.toString()).to.equal(expectedTimestamp.toString());
			});
		});

		describe('transfer', () => {
			it('should transfer NFT from owner to bounty contract', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);

				// ACT

				await tieredFixedContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, tierData);

				// ASSERT
				expect(await mockNft.ownerOf(0)).to.equal(tieredFixedContract.address);
			});
		});
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

			let setInvoiceCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			
			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setInvoiceComplete(setInvoiceCompleteData)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set invoiceComplete for given tier', async () => {
			let setInvoiceCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setInvoiceCompleteData_2 = abiCoder.encode(['uint256', 'bool'], [1, true]);
			// ASSUME
			expect(await tieredFixedContract.invoiceComplete(0)).to.equal(false)
			expect(await tieredFixedContract.invoiceComplete(1)).to.equal(false)
			
			// ACT
			await tieredFixedContract.setInvoiceComplete(setInvoiceCompleteData_1);
			await tieredFixedContract.setInvoiceComplete(setInvoiceCompleteData_2);

			// ASSERT
			expect(await tieredFixedContract.invoiceComplete(0)).to.equal(true)
			expect(await tieredFixedContract.invoiceComplete(1)).to.equal(true)
		})
	})

	describe('setSupportingDocumentsComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			let setSupportingDocumentsCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setSupportingDocumentsComplete(setSupportingDocumentsCompleteData_1)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocumentsComplete', async () => {
			let setSupportingDocumentsCompleteData_1 = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setSupportingDocumentsCompleteData_2 = abiCoder.encode(['uint256', 'bool'], [1, true]);

			// ASSUME
			expect(await tieredFixedContract.supportingDocumentsComplete(0)).to.equal(false)
			expect(await tieredFixedContract.supportingDocumentsComplete(1)).to.equal(false)
			
			// ACT
			await tieredFixedContract.setSupportingDocumentsComplete(setSupportingDocumentsCompleteData_1);
			await tieredFixedContract.setSupportingDocumentsComplete(setSupportingDocumentsCompleteData_2);

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