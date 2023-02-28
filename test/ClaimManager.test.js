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
	tieredFixedBountyInitOperationBuilder,
	setInvoiceCompleteData_tiered,
	setSupportingDocumentsComplete_tiered,
	setInvoiceCompleteData_atomic,
	setSupportingDocumentsComplete_atomic,
	tieredFixedBountyInitOperationBuilder_permissionless
} = require('./constants');

describe('ClaimManager.sol', () => {
	// MOCK ASSETS
	let openQProxy;
	let openQImplementation;
	let claimManager;
	let depositManager;
	let mockLink;
	let mockDai;
	let blacklistedMockDai;
	let openQTokenWhitelist;
	let mockKyc;

	let claimManagerImplementation;

	// ACCOUNTS
	let owner;
	let notOwner;
	let oracle;
	let claimant;
	let claimantSecondPlace;
	let claimantThirdPlace;

	// CONSTANTS
	let zeroTier
	let oneTier

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let tieredFixedBountyInitOperation_permissionless;
	let tieredFixedBountyInitOperation_permissioned;

	// CLOSER DATA
	let abiCoder;

	let abiEncodedSingleCloserData;
	let abiEncodedOngoingCloserData;
	let abiEncodedTieredCloserData;
	let abiEncodedTieredFixedCloserData;
	let abiEncodedTieredCloserDataFirstPlace;
	let abiEncodedTieredCloserDataSecondPlace;
	let abiEncodedTieredCloserDataThirdPlace;

	let AtomicBountyV1
	let TieredFixedBountyV1

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManagerV1');
		const ClaimManager = await ethers.getContractFactory('ClaimManagerV1');
		const MockKyc = await ethers.getContractFactory('MockKyc');

		AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');

		// BOUNTY IMPLEMENTATIONS
		atomicBountyV1 = await AtomicBountyV1.deploy();
		await atomicBountyV1.deployed();
		
		tieredFixedBountyV1 = await TieredFixedBountyV1.deploy();
		await tieredFixedBountyV1.deployed();

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');

		[owner, claimant, oracle, claimantSecondPlace, claimantThirdPlace, notOwner] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		mockKyc = await MockKyc.deploy();
		await mockKyc.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		blacklistedMockDai = await MockDai.deploy();
		await blacklistedMockDai.deployed();

		openQTokenWhitelist = await OpenQTokenWhitelist.deploy();
		await openQTokenWhitelist.deployed();

		await openQTokenWhitelist.addToken(mockLink.address);
		await openQTokenWhitelist.addToken(mockDai.address);
		await openQTokenWhitelist.addToken(ethers.constants.AddressZero);

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

		let depositManagerImplementation = await DepositManager.deploy();
		await depositManagerImplementation.deployed();
		const DepositManagerProxy = await ethers.getContractFactory('OpenQProxy');
		let depositManagerProxy = await DepositManagerProxy.deploy(depositManagerImplementation.address, []);
		await depositManagerProxy.deployed();
		depositManager = await DepositManager.attach(depositManagerProxy.address);

		claimManagerImplementation = await ClaimManager.deploy();
		await claimManagerImplementation.deployed();
		const ClaimManagerProxy = await ethers.getContractFactory('OpenQProxy');
		let claimManagerProxy = await ClaimManagerProxy.deploy(claimManagerImplementation.address, []);
		await claimManagerProxy.deployed();
		claimManager = await ClaimManager.attach(claimManagerProxy.address);
		

		await openQProxy.initialize(oracle.address, bountyFactory.address, depositManager.address, claimManager.address);
		await depositManager.initialize(openQProxy.address, openQTokenWhitelist.address);
		await claimManager.initialize(oracle.address, openQProxy.address, mockKyc.address);

		abiCoder = new ethers.utils.AbiCoder;

		atomicBountyInitOperation = atomicBountyInitOperation_fundingGoal(mockLink.address)
		
		tieredFixedBountyInitOperation_permissionless = tieredFixedBountyInitOperationBuilder_permissionless(mockLink.address)
		tieredFixedBountyInitOperation_permissioned = tieredFixedBountyInitOperationBuilder(mockLink.address)

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredFixedCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);
		abiEncodedTieredCloserDataSecondPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredCloserDataThirdPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 2]);

		zeroTier = abiCoder.encode(['uint256'], [0]);
		oneTier = abiCoder.encode(['uint256'], [1]);
	});

	describe('initialization', () => {
		it('should initialize with correct fields', async () => {
			expect(await claimManager.oracle()).equals(oracle.address);
			expect(await claimManager.openQ()).equals(openQProxy.address);
			expect(await claimManager.kyc()).equals(mockKyc.address);
		});
	});

	describe('transferOracle', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			let notOwnerContract = claimManager.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.transferOracle(owner.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await expect(claimManagerImplementation.transferOracle(owner.address)).to.be.revertedWith('Function must be called through delegatecall');
		});

		it('should transfer oracle address', async () => {
			// ASSUME
			expect(await claimManager.oracle()).equals(oracle.address);

			// ACT
			await claimManager.transferOracle(notOwner.address);

			// ASSERT
			expect(await claimManager.oracle()).equals(notOwner.address);
		});
	});

	describe('claimBounty', () => {

		describe('ALL', () => {
			it('should revert if not called by OpenQ Oracle', async () => {
				// ASSERT
				await expect(claimManager.claimBounty(ethers.constants.AddressZero, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('Oraclize: caller is not the current OpenQ Oracle');
			});
		});

		describe('ATOMIC', () => {
			describe('REVERTS', () => {
				it('should revert if bounty is already claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('CONTRACT_IS_NOT_CLAIMABLE');
				});
			});

			describe('BOUNTY UPDATES', () => {
				it('should close issue after successful claim', async () => {
					// ARRANGE
					// ASSUME
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const openBounty = await openQProxy.bountyIsOpen(Constants.bountyId);
					expect(openBounty).to.equal(true);

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					const closedBounty = await openQProxy.bountyIsOpen(Constants.bountyId);
					expect(closedBounty).to.equal(false);
				});

				it('should set closer to the claimant address', async () => {
					// ARRANGE
					// ASSUME
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const newBounty = await AtomicBountyV1.attach(
						bountyAddress
					);

					const closer = await newBounty.closer();
					expect(closer).to.equal(ethers.constants.AddressZero);

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					const newCloser = await newBounty.closer();
					expect(newCloser).to.equal(owner.address);
				});

				it('should set close time correctly', async () => {
					// ARRANGE
					// ASSUME
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const newBounty = await AtomicBountyV1.attach(
						bountyAddress
					);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ASSUME
					const bountyClosedTime = await newBounty.bountyClosedTime();
					expect(bountyClosedTime).to.equal(0);

					const closer = await newBounty.closer();
					expect(closer).to.equal(ethers.constants.AddressZero);

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					const newCloser = await newBounty.closer();
					expect(newCloser).to.equal(owner.address);
				});
			});

			describe('TRANSFER', () => {
				it('should transfer all assets from bounty contract to claimant', async () => {
					// ARRANGE
					const volume = 100;
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);

					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1, Constants.funderUuid);
					await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, Constants.funderUuid, { value: volume });

					// ASSUME
					const bountyMockLinkTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
					const bountyDaiTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
					const bountyProtcolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
					expect(bountyMockLinkTokenBalance).to.equal('100');
					expect(bountyDaiTokenBalance).to.equal('100');
					expect(bountyProtcolTokenBalance).to.equal('100');

					const claimantMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
					const claimantFakeTokenBalance = (await mockDai.balanceOf(claimant.address)).toString();
					expect(claimantMockTokenBalance).to.equal('0');
					expect(claimantFakeTokenBalance).to.equal('0');

					// // // ACT

					await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedSingleCloserData);

					// // ASSERT
					const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
					const newBountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
					const newBountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
					expect(newBountyMockTokenBalance).to.equal('0');
					expect(newBountyFakeTokenBalance).to.equal('0');
					expect(newBountyProtocolTokenBalance).to.equal('0');

					const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
					const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimant.address)).toString();
					expect(newClaimerMockTokenBalance).to.equal('100');
					expect(newClaimerFakeTokenBalance).to.equal('100');
				});
			});

			describe('EVENTS', () => {
				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const volume = 100;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);
					await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, Constants.funderUuid, { value: volume });

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockLink.address, volume, 0, abiEncodedSingleCloserData, Constants.VERSION_1)
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockDai.address, volume, 0, abiEncodedSingleCloserData, Constants.VERSION_1)
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, ethers.constants.AddressZero, volume, 0, abiEncodedSingleCloserData, Constants.VERSION_1);
				});

				it('should emit a BountyClosed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, 0, abiEncodedSingleCloserData, Constants.VERSION_1);
				});
			});
		});

		describe('TIERED FIXED', () => {
			describe('REVERTS', () => {
				it('should revert if tier is already claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissionless);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

					claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData)).to.be.revertedWith('TIER_ALREADY_CLAIMED');
				});
			});

			describe('EVENTS', () => {
				it('should emit BountyClosed event', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissionless);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const volume = 1000;
					const bounty = TieredFixedBountyV1.attach(bountyAddress);
					const payoutSchedule = await bounty.getPayoutSchedule();
					const proportion = payoutSchedule[1].toString();
					const payoutAmount = (proportion / 100) * volume;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1, Constants.funderUuid);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, ethers.constants.AddressZero, expectedTimestamp, 3, '0x', Constants.VERSION_1);
				});
			});
		});

		describe('Event Emissions', () => {
			it('should emit a Claim event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT

				await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
					.to.emit(claimManager, 'ClaimSuccess')
					.withArgs(expectedTimestamp, 0, abiEncodedSingleCloserData, Constants.VERSION_1);
			});
		});
	});

	describe('tierClaimed', () => {
		it('should return FALSE if tier not claimed, TRUE if already claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissionless);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

			// ASSUME
			let tierClaimed = await openQProxy.tierClaimed(Constants.bountyId, 1);
			expect(tierClaimed).to.equal(false);

			// ACT
			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

			// // // ASSERT
			tierClaimed = await openQProxy.tierClaimed(Constants.bountyId, 1);
			expect(tierClaimed).to.equal(true);
		});
	});

	describe('setOpenQ', () => {
		it('should correctly set OpenQ address', async () => {
			// ASSUME
			const initialAddress = await claimManager.openQ();
			expect(initialAddress).to.equal(openQProxy.address);

			// ACT
			await claimManager.setOpenQ(oracle.address);

			// ASSERT
			const setOpenQAddress = await claimManager.openQ();
			expect(setOpenQAddress).to.equal(oracle.address);
		});
	});

	describe('permissionedClaimTieredBounty', () => {

		it('should revert if caller lacks associated address to their uuid', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('NO_ASSOCIATED_ADDRESS');
		});

		it('should revert if claimant not tier winner', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('CLAIMANT_NOT_TIER_WINNER');
		});

		it('should revert if caller lacks invoice', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)

			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('INVOICE_NOT_COMPLETE');
		});

		it('should revert if caller lacks supporting documents', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			// Set Permissions
			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData_tiered(0, true))

			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('SUPPORTING_DOCS_NOT_COMPLETE');
		});

		it('should revert if caller is lacks KYC', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData_tiered(0, true))
			await openQProxy.setSupportingDocumentsComplete(Constants.bountyId, setSupportingDocumentsComplete_tiered(0, true))

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('ADDRESS_LACKS_KYC');
		});

		it('should transfer tier to closer - TIERED FIXED', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation_permissioned);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const expectedTimestamp = await setNextBlockTimestamp();
			const volume = 100;

			const bounty = await TieredFixedBountyV1.attach(bountyAddress);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);

			// ASSUME
			const bountyMockLinkTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
			expect(bountyMockLinkTokenBalance).to.equal('100');

			const claimantMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
			expect(claimantMockTokenBalance).to.equal('0');

			// ARRANGE
			// Set Permissions
			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, claimant.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData_tiered(0, true))
			await openQProxy.setSupportingDocumentsComplete(Constants.bountyId, setSupportingDocumentsComplete_tiered(0, true))

			// ACT
			await claimManager.connect(claimant).permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace);

			// ASSERT
			const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
			expect(newBountyMockTokenBalance).to.equal('20');

			const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('80');
		});
	})

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