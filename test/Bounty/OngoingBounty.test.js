/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const Constants = require('../constants');
const { generateDepositId, generateClaimantId } = require('../utils');

describe('OngoingBountyV1.sol', () => {
	// CONTRACT FACTORIES
	let OngoingBountyV1;

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
	let ongoingContractInitOperation;

	// TEST CONTRACTS
	let ongoingContract;
	let ongoingContract_noFundingGoal;

	// MISC
	let initializationTimestampAtomic;
	let initializationTimestampOngoingNoFundingGoal;

	beforeEach(async () => {
		OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
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

		// ONGOIN CONTRACT
		ongoingContract = await OngoingBountyV1.deploy();
		await ongoingContract.deployed();
		let abiEncodedParamsFundingGoalBounty = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [mockLink.address, '100', true, mockLink.address, '100', true, true, true, Constants.mockOpenQId, "", ""]);
		ongoingContractInitOperation = [Constants.ONGOING_CONTRACT, abiEncodedParamsFundingGoalBounty];
		initializationTimestamp = await setNextBlockTimestamp();
		await ongoingContract.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, ongoingContractInitOperation);

		await mockNft.approve(ongoingContract.address, 0);
		await mockNft.approve(ongoingContract.address, 1);
		await mockNft.approve(ongoingContract.address, 2);
		await mockNft.approve(ongoingContract.address, 3);
		await mockNft.approve(ongoingContract.address, 4);
		await mockNft.approve(ongoingContract.address, 5);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(ongoingContract.address, 10000000);
		await mockDai.approve(ongoingContract.address, 10000000);

		// ATOMIC CONTRACT W/ NO FUNDING GOAL
		ongoingContract_noFundingGoal = await OngoingBountyV1.deploy();
		await ongoingContract_noFundingGoal.deployed();
		let abiEncodedParamsNoFundingGoalBounty = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [mockLink.address, '100', false, ethers.constants.AddressZero, '0', true, true, true, Constants.mockOpenQId, "", ""]);
		const ongoingBountyNoFundingGoalInitOperation = [Constants.ONGOING_CONTRACT, abiEncodedParamsNoFundingGoalBounty];
		initializationTimestampOngoingNoFundingGoal = await setNextBlockTimestamp();
		await ongoingContract_noFundingGoal.initialize(Constants.bountyId, owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, ongoingBountyNoFundingGoalInitOperation);
	});

	describe('initializer', () => {
		it(`should initialize bounty with correct metadata`, async () => {
			// ARRANGE/ASSERT
			await expect(await ongoingContract.bountyId()).equals(Constants.bountyId);
			await expect(await ongoingContract.issuer()).equals(owner.address);
			await expect(await ongoingContract.organization()).equals(Constants.organization);
			await expect(await ongoingContract.status()).equals(0);
			await expect(await ongoingContract.openQ()).equals(owner.address);
			await expect(await ongoingContract.claimManager()).equals(claimManager.address);
			await expect(await ongoingContract.depositManager()).equals(depositManager.address);
			await expect(await ongoingContract.bountyCreatedTime()).equals(initializationTimestamp);
			await expect(await ongoingContract.bountyType()).equals(Constants.ONGOING_CONTRACT);
			await expect(await ongoingContract.hasFundingGoal()).equals(true);
			await expect(await ongoingContract.fundingToken()).equals(mockLink.address);
			await expect(await ongoingContract.fundingGoal()).equals(100);
			await expect(await ongoingContract.invoiceRequired()).equals(true);
			await expect(await ongoingContract.kycRequired()).equals(true);
			await expect(await ongoingContract.issuerExternalUserId()).equals(Constants.mockOpenQId);
			await expect(await ongoingContract.supportingDocumentsRequired()).equals(true);
		});

		it('should revert if bountyId is empty', async () => {
			// ARRANGE
			const OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
			ongoingContract = await OngoingBountyV1.deploy();

			// ASSERT
			await expect(ongoingContract.initialize("", owner.address, Constants.organization, owner.address, claimManager.address, depositManager.address, ongoingContractInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
		});

		it('should revert if organization is empty', async () => {
			// ARRANGE
			const OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
			ongoingContract = await OngoingBountyV1.deploy();

			// ASSERT
			await expect(ongoingContract.initialize(Constants.bountyId, owner.address, "", owner.address, claimManager.address, depositManager.address, ongoingContractInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
		});
	});

	describe('receiveNFT', () => {

		describe('REVERTS', () => {
			it('should revert if too many NFT deposits', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
				expect(await mockNft.ownerOf(2)).to.equal(owner.address);
				expect(await mockNft.ownerOf(3)).to.equal(owner.address);
				expect(await mockNft.ownerOf(4)).to.equal(owner.address);

				// ACT
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, []);
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, []);
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 2, 1, []);
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 3, 1, []);
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 4, 1, []);

				// ASSERT
				await expect(ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 5, 1, [])).to.be.revertedWith('NFT_DEPOSIT_LIMIT_REACHED');
			});

			it('should revert if expiration is negative', async () => {
				await expect(ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 0, [])).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});
		});

		describe('DEPOSIT INITIALIZATION', () => {
			it(`should initialize nft deposit data with correct metadata`, async () => {

				// ACT
				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(Constants.bountyId, 0);
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, Constants.thirtyDays, []);

				// ASSERT
				expect(await ongoingContract.funder(depositId)).to.equal(owner.address);
				expect(await ongoingContract.tokenAddress(depositId)).to.equal(mockNft.address);
				expect(await ongoingContract.tokenId(depositId)).to.equal(1);
				expect(await ongoingContract.expiration(depositId)).to.equal(Constants.thirtyDays);
				expect(await ongoingContract.isNFT(depositId)).to.equal(true);

				const depositTime = await ongoingContract.depositTime(depositId);
				expect(depositTime.toString()).to.equal(expectedTimestamp.toString());
			});
		});

		describe('transfer', () => {
			it('should transfer NFT from owner to bounty contract', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);

				// ACT
				await ongoingContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, []);

				// ASSERT
				expect(await mockNft.ownerOf(0)).to.equal(ongoingContract.address);
			});
		});
	});

	describe('claimOngoingPayout', () => {
		it('should transfer payoutVolume of payoutTokenAddress to claimant', async () => {
			// ARRANGE
			const volume = 300;

			const [, claimer] = await ethers.getSigners();

			await ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, Constants.thirtyDays);

			const deposits = await ongoingContract.getDeposits();
			const linkDepositId = deposits[0];

			// ASSUME
			const bountyMockTokenBalance = (await mockLink.balanceOf(ongoingContract.address)).toString();
			expect(bountyMockTokenBalance).to.equal('300');

			const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
			expect(claimerMockTokenBalance).to.equal('0');

			// ACT
			await ongoingContract.connect(claimManager).claimOngoingPayout(claimer.address, closerData);

			// ASSERT
			const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('100');

			const newBountyMockLinkBalance = (await mockLink.balanceOf(ongoingContract.address)).toString();
			expect(newBountyMockLinkBalance).to.equal('200');

			// ACT
			await ongoingContract.connect(claimManager).claimOngoingPayout(claimer.address, closerData);

			// ASSERT
			const newClaimerMockTokenBalance2 = (await mockLink.balanceOf(claimer.address)).toString();
			expect(newClaimerMockTokenBalance2).to.equal('200');

			const newBountyMockLinkBalance2 = (await mockLink.balanceOf(ongoingContract.address)).toString();
			expect(newBountyMockLinkBalance2).to.equal('100');
		});

		it('should set claimantId to true for the claimant and claimant asset', async () => {
			// ARRANGE
			let claimantId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");
			await ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 10000000, Constants.thirtyDays);


			// ASSUME
			let claimantIdClaimed = await ongoingContract.claimantId(claimantId);
			expect(claimantIdClaimed).to.equal(false);

			// ACT
			await ongoingContract.connect(claimManager).claimOngoingPayout(owner.address, closerData);

			// ASSERT
			claimantIdClaimed = await ongoingContract.claimantId(claimantId);
			expect(claimantIdClaimed).to.equal(true);
		});

		it('should revert if not called by claim manager', async () => {
			// ACT/ASSERT
			await expect(ongoingContract.claimOngoingPayout(owner.address, closerData)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
		});
	});

	describe('setPayout', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(ongoingContract.connect(notOwner).setPayout(mockLink.address, 100)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set payoutTokenAddress and payoutTokenVolume', async () => {
			// ASSUME
			expect(await ongoingContract.payoutTokenAddress()).to.equal(mockLink.address)
			expect(await ongoingContract.payoutVolume()).to.equal(100)

			// ACT
			await ongoingContract.setPayout(mockDai.address, 250);

			// ASSERT
			expect(await ongoingContract.payoutTokenAddress()).to.equal(mockDai.address)
			expect(await ongoingContract.payoutVolume()).to.equal(250)
		})
	})

	describe('closeOngoing', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, , , , , notOpenQ] = await ethers.getSigners();

			// ASSERT
			await expect(ongoingContract.connect(notOpenQ).closeOngoing(owner.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if already closed', async () => {
			// ARRANGE
			ongoingContract.connect(owner).closeOngoing(owner.address);
			//ACT / ASSERT
			await expect(ongoingContract.connect(owner).closeOngoing(owner.address)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
		});

		it('should change status to CLOSED (1)', async () => {
			// ASSUME
			await expect(await ongoingContract.status()).equals(0);
			//ACT
			await ongoingContract.connect(owner).closeOngoing(owner.address);
			// ASSERT
			await expect(await ongoingContract.status()).equals(1);
		});

		it('should set bountyClosedTime to the block timestamp', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();
			// ASSUME
			await expect(await ongoingContract.bountyClosedTime()).equals(0);
			//ACT
			await ongoingContract.connect(owner).closeOngoing(owner.address);
			// ASSERT
			await expect(await ongoingContract.bountyClosedTime()).equals(expectedTimestamp);
		});
	});

	describe('setInvoiceComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			const claimId = generateClaimantId(Constants.mockOpenQId, Constants.mockClaimantAsset)
			let setInvoiceCompleteData = abiCoder.encode(["bytes32", "bool"], [claimId, true]);

			// ASSERT
			await expect(ongoingContract.connect(notOwner).setInvoiceComplete(setInvoiceCompleteData)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set invoiceComplete for given claimantId', async () => {
			const claimId = generateClaimantId(Constants.mockOpenQId, Constants.mockClaimantAsset)
			let setInvoiceCompleteData = abiCoder.encode(["bytes32", "bool"], [claimId, true]);
			
			// ASSUME
			expect(await ongoingContract.invoiceComplete(claimId)).to.equal(false)

			// ACT
			await ongoingContract.setInvoiceComplete(setInvoiceCompleteData);

			// ASSERT
			expect(await ongoingContract.invoiceComplete(claimId)).to.equal(true)
		})
	})

	describe('setSupportingDocumentsComplete', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			const claimId = generateClaimantId(Constants.mockOpenQId, Constants.mockClaimantAsset)
			let setSupportingDocumentsCompleteData = abiCoder.encode(["bytes32", "bool"], [claimId, true]);

			// ASSERT
			await expect(ongoingContract.connect(notOwner).setSupportingDocumentsComplete(setSupportingDocumentsCompleteData)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocumentsComplete for given claimantId', async () => {
			const claimId = generateClaimantId(Constants.mockOpenQId, Constants.mockClaimantAsset)
			let setSupportingDocumentsCompleteData = abiCoder.encode(["bytes32", "bool"], [claimId, true]);

			// ASSUME
			expect(await ongoingContract.supportingDocumentsComplete(claimId)).to.equal(false)
			
			// ACT
			await ongoingContract.setSupportingDocumentsComplete(setSupportingDocumentsCompleteData);

			// ASSERT
			expect(await ongoingContract.supportingDocumentsComplete(claimId)).to.equal(true)
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