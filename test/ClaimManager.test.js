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
	ongoingBountyInitOperationBuilder,
	tieredBountyInitOperationBuilder,
	tieredFixedBountyInitOperationBuilder,
	tieredBountyInitOperation_not100
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
	let mockNft;
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
	let ongoingBountyInitOperation;
	let tieredPercentageBountyInitOperation;
	let tieredFixedBountyInitOperation;

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
	let OngoingBountyV1
	let TieredPercentageBountyV1
	let TieredFixedBountyV1

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManagerV1');
		const ClaimManager = await ethers.getContractFactory('ClaimManagerV1');
		const MockKyc = await ethers.getContractFactory('MockKyc');

		AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
		OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
		TieredPercentageBountyV1 = await ethers.getContractFactory('TieredPercentageBountyV1');
		TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');

		// BOUNTY IMPLEMENTATIONS
		atomicBountyV1 = await AtomicBountyV1.deploy();
		await atomicBountyV1.deployed();
		
		ongoingBountyV1 = await OngoingBountyV1.deploy();
		await ongoingBountyV1.deployed();
		
		tieredPercentageBountyV1 = await TieredPercentageBountyV1.deploy();
		await tieredPercentageBountyV1.deployed();
		
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

		await openQProxy.initialize();
		await openQProxy.transferOracle(oracle.address);

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

		// BOUNTY BEACONS
		atomicBountyBeacon = await BountyBeacon.deploy(atomicBountyV1.address);
		await atomicBountyBeacon.deployed();

		ongoingBountyBeacon = await BountyBeacon.deploy(ongoingBountyV1.address);
		await ongoingBountyBeacon.deployed();

		tieredPercentageBountyBeacon = await BountyBeacon.deploy(tieredPercentageBountyV1.address);
		await tieredPercentageBountyBeacon.deployed();

		tieredFixedBountyBeacon = await BountyBeacon.deploy(tieredFixedBountyV1.address);
		await tieredFixedBountyBeacon.deployed();

		// BOUNTY FACTORY
		bountyFactory = await BountyFactory.deploy(
			openQProxy.address,
			atomicBountyBeacon.address,
			ongoingBountyBeacon.address,
			tieredPercentageBountyBeacon.address,
			tieredFixedBountyBeacon.address
			);
		await bountyFactory.deployed();

		let depositManagerImplementation = await DepositManager.deploy();
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
		await claimManager.setOpenQ(openQProxy.address);
		await claimManager.setKyc(mockKyc.address);

		await openQProxy.setBountyFactory(bountyFactory.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;

		atomicBountyInitOperation = atomicBountyInitOperation_fundingGoal(mockLink.address)
		ongoingBountyInitOperation = ongoingBountyInitOperationBuilder(mockLink.address)
		tieredPercentageBountyInitOperation = tieredBountyInitOperationBuilder(mockLink.address)
		tieredFixedBountyInitOperation = tieredFixedBountyInitOperationBuilder(mockLink.address)

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
			expect(await claimManager.oracle()).equals('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
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

	describe('bountyIsClaimable', () => {
		describe('ATOMIC', () => {
			it('should return TRUE if atomic bounty is open, FALSE if atomic bounty is closed', async () => {
				// ARRANGE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

				// ASSUME
				let bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(true);

				// ACT
				await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

				// ASSERT
				bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(false);
			});
		});

		describe('ONGOING', () => {
			it('should return TRUE if ongoing bounty is open, FALSE if ongoing bounty is closed', async () => {
				// ARRANCE
				await openQProxy.mintBounty(Constants.bountyId, Constants.organization, ongoingBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

				// ASSUME
				let bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(true);

				// ACT
				await openQProxy.closeOngoing(Constants.bountyId);

				// ASSERT
				bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(false);
			});
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

				it('should transfer all NFT assets from bounty contract to claimant', async () => {
					// ASSUME
					expect(await mockNft.ownerOf(1)).to.equal(owner.address);

					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					// ACT

					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					expect(await mockNft.ownerOf(1)).to.equal(owner.address);
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

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await mockNft.approve(bountyAddress, 1);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, zeroTier);

					// Closer data for 2nd and 3rd place
					let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockNft.address, 1, 0, abiEncodedSingleCloserData, Constants.VERSION_1);
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

		describe('ONGOING', () => {
			describe('REVERTS', () => {
				it('should revert if ongoing bounty is closed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, ongoingBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await openQProxy.closeOngoing(Constants.bountyId);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('CONTRACT_IS_NOT_CLAIMABLE');
				});
			});

			describe('TRANSFER', () => {
				it('should transfer payoutAmount from bounty pool to claimant', async () => {
					// ARRANGE
					const volume = 1000;
					const expectedTimestamp = await setNextBlockTimestamp();

					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, ongoingBountyInitOperation);

					const bountyIsOpen = await openQProxy.bountyIsOpen(Constants.bountyId);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const newBounty = await OngoingBountyV1.attach(
						bountyAddress
					);

					await mockLink.approve(bountyAddress, 10000000);

					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);

					// ACT

					await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedOngoingCloserData);

					// ASSERT
					const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
					expect(newBountyMockTokenBalance).to.equal('900');

					const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
					expect(newClaimerMockTokenBalance).to.equal('100');
				});
			});

			describe('EVENTS', () => {
				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, ongoingBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const volume = 1000;
					const bounty = OngoingBountyV1.attach(bountyAddress);
					const payoutVolume = await bounty.payoutVolume();

					await mockLink.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1, Constants.funderUuid);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedOngoingCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockLink.address, payoutVolume, 1, abiEncodedOngoingCloserData, Constants.VERSION_1);
				});
			});
		});

		describe('TIERED', () => {
			describe('REVERTS', () => {
				it('should revert if tier is claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData)).to.be.revertedWith('TIER_ALREADY_CLAIMED');
				});
			});

			describe('BOUNTY UPDATES', () => {
				it('should close competition if it is the first claimant', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
					const bounty = TieredPercentageBountyV1.attach(bountyAddress);

					// ASSUME
					const isOpen = await bounty.status();
					await expect(isOpen).to.equal(0);

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

					// ACT/ASSERT
					const isClosed = await bounty.status();
					await expect(isClosed).to.equal(1);
				});
			});

			describe('TRANSFER', () => {
				it('should transfer all assets from bounty contract to claimant', async () => {
					// ARRANGE
					const volume = 1000;
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);

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
					expect(bountyMockLinkTokenBalance).to.equal('1000');
					expect(bountyDaiTokenBalance).to.equal('1000');
					expect(bountyProtcolTokenBalance).to.equal('1000');

					const claimantMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
					const claimantFakeTokenBalance = (await mockDai.balanceOf(claimant.address)).toString();
					const claimantProtocolTokenBalance = (await ethers.provider.getBalance(claimant.address)).toString();
					expect(claimantMockTokenBalance).to.equal('0');
					expect(claimantFakeTokenBalance).to.equal('0');

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedTieredCloserDataFirstPlace);
					await claimManager.connect(oracle).claimBounty(bountyAddress, claimantSecondPlace.address, abiEncodedTieredCloserDataSecondPlace);
					await claimManager.connect(oracle).claimBounty(bountyAddress, claimantThirdPlace.address, abiEncodedTieredCloserDataThirdPlace);

					// ASSERT
					const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
					const newBountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
					const newBountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
					expect(newBountyMockTokenBalance).to.equal('0');
					expect(newBountyFakeTokenBalance).to.equal('0');
					expect(newBountyProtocolTokenBalance).to.equal('0');

					const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
					const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimant.address)).toString();
					const newClaimerProtocolTokenBalance = (await ethers.provider.getBalance(claimant.address)).toString();
					expect(newClaimerMockTokenBalance).to.equal('600');
					expect(newClaimerFakeTokenBalance).to.equal('600');

					const newClaimerMockTokenBalanceSecondPlace = (await mockLink.balanceOf(claimantSecondPlace.address)).toString();
					const newClaimerFakeTokenBalanceSecondPlace = (await mockDai.balanceOf(claimantSecondPlace.address)).toString();
					const newClaimerProtocolTokenBalanceSecondPlace = (await ethers.provider.getBalance(claimantSecondPlace.address)).toString();
					expect(newClaimerMockTokenBalanceSecondPlace).to.equal('300');
					expect(newClaimerFakeTokenBalanceSecondPlace).to.equal('300');

					const newClaimerMockTokenBalanceThirdPlace = (await mockLink.balanceOf(claimantThirdPlace.address)).toString();
					const newClaimerFakeTokenBalanceThirdPlace = (await mockDai.balanceOf(claimantThirdPlace.address)).toString();
					const newClaimerProtocolTokenBalanceThirdPlace = (await ethers.provider.getBalance(claimantThirdPlace.address)).toString();
					expect(newClaimerMockTokenBalanceThirdPlace).to.equal('100');
					expect(newClaimerFakeTokenBalanceThirdPlace).to.equal('100');
				});

				it('should transfer NFT assets with the same tier the claimant won and emit an NFTClaimed event', async () => {
					const FIRST_PLACE_NFT = 1;
					const SECOND_PLACE_NFT = 2;

					// ASSUME
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(owner.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(owner.address);

					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					// Fund with NFTs for 2nd and 3rd place
					await mockNft.approve(bountyAddress, FIRST_PLACE_NFT);
					await mockNft.approve(bountyAddress, SECOND_PLACE_NFT);

					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, FIRST_PLACE_NFT, 1, zeroTier);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, SECOND_PLACE_NFT, 1, oneTier);

					let expectedTimestamp = await setNextBlockTimestamp();

					// ACT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedTieredCloserDataFirstPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, claimant.address, expectedTimestamp, mockNft.address, 1, 2, abiEncodedTieredCloserDataFirstPlace, Constants.VERSION_1);


					expectedTimestamp = await setNextBlockTimestamp();
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, claimantSecondPlace.address, abiEncodedTieredCloserDataSecondPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, claimantSecondPlace.address, expectedTimestamp, mockNft.address, 2, 2, abiEncodedTieredCloserDataSecondPlace, Constants.VERSION_1);

					// ASSERT
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(claimant.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(claimantSecondPlace.address);
				});
			});

			describe('EVENTS', () => {
				it('should emit a BountyClosed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const volume = 1000;
					const bounty = TieredPercentageBountyV1.attach(bountyAddress);
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

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, ethers.constants.AddressZero, expectedTimestamp, 2, '0x', Constants.VERSION_1);
				});

				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					const volume = 1000;
					const bounty = TieredPercentageBountyV1.attach(bountyAddress);
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

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockLink.address, payoutAmount, 2, abiEncodedTieredCloserData, Constants.VERSION_1)
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockDai.address, payoutAmount, 2, abiEncodedTieredCloserData, Constants.VERSION_1);
				});

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await mockNft.approve(bountyAddress, 1);

					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, zeroTier);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserDataFirstPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(Constants.bountyId, bountyAddress, Constants.organization, owner.address, expectedTimestamp, mockNft.address, 1, 2, abiEncodedTieredCloserDataFirstPlace, Constants.VERSION_1);
				});
			});
		});

		describe('TIERED FIXED', () => {
			describe('REVERTS', () => {
				it('should revert if tier is already claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

					claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData)).to.be.revertedWith('TIER_ALREADY_CLAIMED');
				});
			});

			describe('TRANSFER', () => {
				it('should transfer NFT assets with tier corresponding to the tier the claimant won', async () => {
					const FIRST_PLACE_NFT = 1;
					const SECOND_PLACE_NFT = 2;

					// ASSUME
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(owner.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(owner.address);

					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

					// Fund with NFTs for 2nd and 3rd place
					await mockNft.approve(bountyAddress, FIRST_PLACE_NFT);
					await mockNft.approve(bountyAddress, SECOND_PLACE_NFT);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, FIRST_PLACE_NFT, 1, zeroTier);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, SECOND_PLACE_NFT, 1, oneTier);

					// Closer data for 2nd and 3rd place
					let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);
					let abiEncodedTieredCloserDataSecondPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);

					// ACT

					await claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedTieredCloserDataFirstPlace);
					await claimManager.connect(oracle).claimBounty(bountyAddress, claimantSecondPlace.address, abiEncodedTieredCloserDataSecondPlace);

					// ASSERT
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(claimant.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(claimantSecondPlace.address);
				});
			});

			describe('EVENTS', () => {
				it('should emit BountyClosed event', async () => {
					// ARRANGE
					await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation);
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
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await TieredPercentageBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

			// ASSUME
			let tierClaimed = await openQProxy.tierClaimed(Constants.bountyId, 1);
			expect(tierClaimed).to.equal(false);

			// ACT
			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

			// // ASSERT
			// tierClaimed = await openQProxy.tierClaimed(Constants.bountyId, 1);
			// expect(tierClaimed).to.equal(true);
		});
	});

	describe('ongoingClaimed', () => {
		it('should return FALSE if ongoing claimant is not claimed, TRUE if it is claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const bounty = await OngoingBountyV1.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1, Constants.funderUuid);

			let claimId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");

			// ASSUME
			let ongoingClaimed = await bounty.claimId(claimId);
			expect(ongoingClaimed).to.equal(false);

			// ACT

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedOngoingCloserData);

			// // ASSERT
			ongoingClaimed = await bounty.claimId(claimId);
			expect(ongoingClaimed).to.equal(true);
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
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('NO_ASSOCIATED_ADDRESS');
		});

		it('should revert if claimant not tier winner', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('CLAIMANT_NOT_TIER_WINNER');
		});

		it('should revert if caller lacks invoice', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)

			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('INVOICE_NOT_COMPLETE');
		});

		it('should revert if caller lacks supporting documents', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			// Set Permissions
			let setInvoiceCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData)
			

			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('SUPPORTING_DOCS_NOT_COMPLETE');
		});

		it('should revert if caller is lacks KYC', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);

			let setInvoiceCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setSupportingDocumentsCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, owner.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData)
			await openQProxy.setSupportingDocumentsComplete(Constants.bountyId, setSupportingDocumentsCompleteData)

			// ASSERT
			await expect(claimManager.permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('ADDRESS_LACKS_KYC');
		});

		it('should transfer tier to closer - TIERED', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredPercentageBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const expectedTimestamp = await setNextBlockTimestamp();
			const volume = 100;

			const bounty = await TieredPercentageBountyV1.attach(
				bountyAddress
			);

			// ACT
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

			// ARRANGE
			// Set Permissions
			let setInvoiceCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setSupportingDocumentsCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, claimant.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData)
			await openQProxy.setSupportingDocumentsComplete(Constants.bountyId, setSupportingDocumentsCompleteData)

			// ACT
			await claimManager.connect(claimant).permissionedClaimTieredBounty(bountyAddress, abiEncodedTieredCloserDataFirstPlace);

			// ASSERT
			const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
			const newBountyFakeTokenBalance = (await mockDai.balanceOf(bountyAddress)).toString();
			const newBountyProtocolTokenBalance = (await ethers.provider.getBalance(bountyAddress)).toString();
			expect(newBountyMockTokenBalance).to.equal('40');
			expect(newBountyFakeTokenBalance).to.equal('40');
			expect(newBountyProtocolTokenBalance).to.equal('40');

			const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
			const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimant.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('60');
			expect(newClaimerFakeTokenBalance).to.equal('60');
		});

		it('should transfer tier to closer - TIERED FIXED', async () => {
			// ARRANGE
			await openQProxy.mintBounty(Constants.bountyId, Constants.organization, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(Constants.bountyId);
			const expectedTimestamp = await setNextBlockTimestamp();
			const volume = 100;

			const bounty = await TieredFixedBountyV1.attach(
				bountyAddress
			);

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
			let setInvoiceCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			let setSupportingDocumentsCompleteData = abiCoder.encode(['uint256', 'bool'], [0, true]);
			await mockKyc.setIsValid(true)
			await openQProxy.connect(oracle).associateExternalIdToAddress(Constants.mockOpenQId, claimant.address)
			await openQProxy.setTierWinner(Constants.bountyId, 0, Constants.mockOpenQId)
			await openQProxy.setInvoiceComplete(Constants.bountyId, setInvoiceCompleteData)
			await openQProxy.setSupportingDocumentsComplete(Constants.bountyId, setSupportingDocumentsCompleteData)

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