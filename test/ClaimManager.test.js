/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe('ClaimManagerV2.sol', () => {
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

	let claimManagerImplementation;

	// ACCOUNTS
	let owner;
	let notOwner;
	let oracle;
	let claimant;
	let claimantSecondPlace;
	let claimantThirdPlace;

	// CONSTANTS
	let bountyId = 'mockIssueId';
	let mockOrg = 'mock-org';

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredBountyInitOperation;
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

	let BountyV1;

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV3');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManager');
		const ClaimManager = await ethers.getContractFactory('ClaimManagerV2');

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
		BountyV1 = await ethers.getContractFactory('BountyV2');

		[owner, claimant, oracle, claimantSecondPlace, claimantThirdPlace, notOwner] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

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

		const bountyV1 = await BountyV1.deploy();
		await bountyV1.deployed();

		const beacon = await BountyBeacon.deploy(bountyV1.address);
		await beacon.deployed();

		bountyFactory = await BountyFactory.deploy(openQProxy.address, beacon.address);
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

		await openQProxy.setBountyFactory(bountyFactory.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;

		const atomicBountyAbiEncodedParams = abiCoder.encode(["bool", "address", "uint256", "bool", "bool"], [true, mockLink.address, 1000, true, true]);
		atomicBountyInitOperation = [0, atomicBountyAbiEncodedParams];

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool"], [mockLink.address, '100', true, mockLink.address, 1000, true, true]);
		ongoingBountyInitOperation = [1, abiEncodedParams];

		const tieredAbiEncodedParams = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool"], [[60, 30, 10], true, mockLink.address, 1000, true, true]);
		tieredBountyInitOperation = [2, tieredAbiEncodedParams];

		const tieredFixedAbiEncodedParams = abiCoder.encode(["uint256[]", "address", "bool", "bool"], [[100, 50], mockLink.address, true, true]);
		tieredFixedBountyInitOperation = [3, tieredFixedAbiEncodedParams];

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredFixedCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);
		abiEncodedTieredCloserDataSecondPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
		abiEncodedTieredCloserDataThirdPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 2]);
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
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ASSUME
				let bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(true);

				// ACT
				await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, []);

				// ASSERT
				bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(false);
			});
		});

		describe('ONGOING', () => {
			it('should return TRUE if ongoing bounty is open, FALSE if ongoing bounty is closed', async () => {
				// ARRANCE
				await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ASSUME
				let bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(true);

				// ACT
				await openQProxy.closeOngoing(bountyId);

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
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('CONTRACT_IS_NOT_CLAIMABLE');
				});
			});

			describe('BOUNTY UPDATES', () => {
				it('should close issue after successful claim', async () => {
					// ARRANGE
					// ASSUME
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const openBounty = await openQProxy.bountyIsOpen(bountyId);
					expect(openBounty).to.equal(true);

					// ACT
					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					const closedBounty = await openQProxy.bountyIsOpen(bountyId);
					expect(closedBounty).to.equal(false);
				});

				it('should set closer to the claimant address', async () => {
					// ARRANGE
					// ASSUME
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const Bounty = await ethers.getContractFactory('BountyV2');

					const newBounty = await Bounty.attach(
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
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const Bounty = await ethers.getContractFactory('BountyV2');

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
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);

					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

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
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					// ACT

					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					expect(await mockNft.ownerOf(1)).to.equal(owner.address);
				});
			});

			describe('EVENTS', () => {
				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 100;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, volume, 0, abiEncodedSingleCloserData, 2)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockDai.address, volume, 0, abiEncodedSingleCloserData, 2)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, ethers.constants.AddressZero, volume, 0, abiEncodedSingleCloserData, 2);
				});

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockNft.approve(bountyAddress, 1);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0);

					// Closer data for 2nd and 3rd place
					let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockNft.address, 1, 0, abiEncodedSingleCloserData, 2);
				});

				it('should emit a BountyClosed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, 0, abiEncodedSingleCloserData, 2);
				});
			});
		});

		describe('ONGOING', () => {
			describe('REVERTS', () => {
				it('should revert if ongoing bounty is closed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await openQProxy.closeOngoing(bountyId);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('CONTRACT_IS_NOT_CLAIMABLE');
				});
			});

			describe('TRANSFER', () => {
				it('should transfer payoutAmount from bounty pool to claimant', async () => {
					// ARRANGE
					const volume = 1000;
					const expectedTimestamp = await setNextBlockTimestamp();

					await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

					const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const Bounty = await ethers.getContractFactory('BountyV2');

					const newBounty = await Bounty.attach(
						bountyAddress
					);

					await mockLink.approve(bountyAddress, 10000000);

					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);

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
					await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 1000;
					const bounty = BountyV1.attach(bountyAddress);
					const payoutVolume = await bounty.payoutVolume();

					await mockLink.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedOngoingCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, payoutVolume, 1, abiEncodedOngoingCloserData, 2);
				});
			});
		});

		describe('TIERED', () => {
			describe('REVERTS', () => {
				it('should revert if tier is claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData)).to.be.revertedWith('TIER_ALREADY_CLAIMED');
				});
			});

			describe('BOUNTY UPDATES', () => {
				it('should close competition if it is the first claimant', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
					const bounty = BountyV1.attach(bountyAddress);

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
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);

					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

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
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					// Fund with NFTs for 2nd and 3rd place
					await mockNft.approve(bountyAddress, FIRST_PLACE_NFT);
					await mockNft.approve(bountyAddress, SECOND_PLACE_NFT);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, FIRST_PLACE_NFT, 1, 0);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, SECOND_PLACE_NFT, 1, 1);

					let expectedTimestamp = await setNextBlockTimestamp();

					// ACT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, claimant.address, abiEncodedTieredCloserDataFirstPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, claimant.address, expectedTimestamp, mockNft.address, 1, 2, abiEncodedTieredCloserDataFirstPlace, 2);


					expectedTimestamp = await setNextBlockTimestamp();
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, claimantSecondPlace.address, abiEncodedTieredCloserDataSecondPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, claimantSecondPlace.address, expectedTimestamp, mockNft.address, 2, 2, abiEncodedTieredCloserDataSecondPlace, 2);

					// ASSERT
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(claimant.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(claimantSecondPlace.address);
				});
			});

			describe('EVENTS', () => {
				it('should emit a BountyClosed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 1000;
					const bounty = BountyV1.attach(bountyAddress);
					const payoutSchedule = await bounty.getPayoutSchedule();
					const proportion = payoutSchedule[1].toString();
					const payoutAmount = (proportion / 100) * volume;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(bountyId, bountyAddress, mockOrg, ethers.constants.AddressZero, expectedTimestamp, 2, '0x', 2);
				});

				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 1000;
					const bounty = BountyV1.attach(bountyAddress);
					const payoutSchedule = await bounty.getPayoutSchedule();
					const proportion = payoutSchedule[1].toString();
					const payoutAmount = (proportion / 100) * volume;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData))
						.to.emit(claimManager, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, payoutAmount, 2, abiEncodedTieredCloserData, 2)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockDai.address, payoutAmount, 2, abiEncodedTieredCloserData, 2);
				});

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockNft.approve(bountyAddress, 1);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, 1, 1, 0);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserDataFirstPlace))
						.to.emit(claimManager, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockNft.address, 1, 2, abiEncodedTieredCloserDataFirstPlace, 2);
				});
			});
		});

		describe('TIERED FIXED', () => {
			describe('REVERTS', () => {
				it('should revert if tier is already claimed', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredFixedBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1);

					claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData);

					// ACT/ASSERT
					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData)).to.be.revertedWith('TIER_ALREADY_CLAIMED');
				});
			});

			describe('BOUNTY UPDATES', () => {

			});

			describe('TRANSFER', () => {
				it('should transfer NFT assets with tier corresponding to the tier the claimant won', async () => {
					const FIRST_PLACE_NFT = 1;
					const SECOND_PLACE_NFT = 2;

					// ASSUME
					expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(owner.address);
					expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(owner.address);

					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					// Fund with NFTs for 2nd and 3rd place
					await mockNft.approve(bountyAddress, FIRST_PLACE_NFT);
					await mockNft.approve(bountyAddress, SECOND_PLACE_NFT);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, FIRST_PLACE_NFT, 1, 0);
					await depositManager.fundBountyNFT(bountyAddress, mockNft.address, SECOND_PLACE_NFT, 1, 1);

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
					await openQProxy.mintBounty(bountyId, mockOrg, tieredFixedBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 1000;
					const bounty = BountyV1.attach(bountyAddress);
					const payoutSchedule = await bounty.getPayoutSchedule();
					const proportion = payoutSchedule[1].toString();
					const payoutAmount = (proportion / 100) * volume;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
					await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT

					await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredFixedCloserData))
						.to.emit(claimManager, 'BountyClosed')
						.withArgs(bountyId, bountyAddress, mockOrg, ethers.constants.AddressZero, expectedTimestamp, 3, '0x', 2);
				});
			});
		});

		describe('Event Emissions', () => {
			it('should emit a Claim event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT

				await expect(claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedSingleCloserData))
					.to.emit(claimManager, 'ClaimSuccess')
					.withArgs(expectedTimestamp, 0, abiEncodedSingleCloserData, 2);
			});
		});
	});

	describe('tierClaimed', () => {
		it('should return FALSE if tier not claimed, TRUE if already claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV2');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1);

			// ASSUME
			let tierClaimed = await openQProxy.tierClaimed(bountyId, 1);
			expect(tierClaimed).to.equal(false);

			// ACT

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedTieredCloserData);

			// ASSERT
			tierClaimed = await openQProxy.tierClaimed(bountyId, 1);
			expect(tierClaimed).to.equal(true);
		});
	});

	describe('ongoingClaimed', () => {
		it('should return FALSE if ongoing claimant is not claimed, TRUE if it is claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV2');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await depositManager.fundBountyToken(bountyAddress, mockLink.address, 10000000, 1);

			let claimantId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");

			// ASSUME
			let ongoingClaimed = await bounty.claimantId(claimantId);
			expect(ongoingClaimed).to.equal(false);

			// ACT

			await claimManager.connect(oracle).claimBounty(bountyAddress, owner.address, abiEncodedOngoingCloserData);

			// // ASSERT
			ongoingClaimed = await bounty.claimantId(claimantId);
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

	describe('directClaimTieredBounty', () => {
		it('should revert if caller is not issuer', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await expect(claimManager.connect(oracle).directClaimTieredBounty(bountyAddress, 'githubUserId', abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('CALLER_NOT_ISSUER');
		});

		it('should revert if there is not address associated with external id', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

			await expect(claimManager.directClaimTieredBounty(bountyAddress, 'githubUserId', abiEncodedTieredCloserDataFirstPlace)).to.be.revertedWith('NO_ASSOCIATED_ADDRESS');
		});

		it('should transfer tier to closer - TIERED', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const expectedTimestamp = await setNextBlockTimestamp();
			const githubUser = 'githubUser';
			await openQProxy.connect(oracle).associateExternalIdToAddress(githubUser, claimant.address);
			const volume = 100;

			const Bounty = await ethers.getContractFactory('BountyV2');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);
			await depositManager.fundBountyToken(bountyAddress, mockDai.address, volume, 1);
			await depositManager.fundBountyToken(bountyAddress, ethers.constants.AddressZero, volume, 1, { value: volume });

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

			// ACT
			await claimManager.directClaimTieredBounty(bountyAddress, githubUser, abiEncodedTieredCloserDataFirstPlace);

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
			await openQProxy.mintBounty(bountyId, mockOrg, tieredFixedBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const expectedTimestamp = await setNextBlockTimestamp();
			const githubUser = 'githubUser';
			await openQProxy.connect(oracle).associateExternalIdToAddress(githubUser, claimant.address);
			const volume = 100;

			const Bounty = await ethers.getContractFactory('BountyV2');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			// ACT
			await mockLink.approve(bountyAddress, 10000000);
			await mockDai.approve(bountyAddress, 10000000);

			await depositManager.fundBountyToken(bountyAddress, mockLink.address, volume, 1);

			// ASSUME
			const bountyMockLinkTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
			expect(bountyMockLinkTokenBalance).to.equal('100');

			const claimantMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
			expect(claimantMockTokenBalance).to.equal('0');

			// ACT
			await claimManager.directClaimTieredBounty(bountyAddress, githubUser, abiEncodedTieredFixedCloserData);

			// ASSERT
			const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
			expect(newBountyMockTokenBalance).to.equal('50');

			const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimant.address)).toString();
			expect(newClaimerMockTokenBalance).to.equal('50');
		});

		it('should emit a Claim event with correct parameters', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			await openQProxy.connect(oracle).associateExternalIdToAddress('githubUser', owner.address);

			const Bounty = await ethers.getContractFactory('BountyV2');

			const bounty = await Bounty.attach(
				bountyAddress
			);

			const expectedTimestamp = await setNextBlockTimestamp();
			// ACT
			// ASSERT
			await expect(claimManager.directClaimTieredBounty(bountyAddress, 'githubUser', abiEncodedTieredCloserDataFirstPlace))
				.to.emit(claimManager, 'ClaimSuccess')
				.withArgs(expectedTimestamp, 2, abiEncodedTieredCloserDataFirstPlace, 2);
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