/* eslint-disable */
require('@nomiclabs/hardhat-waffle');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");
const { generateDepositId, generateClaimantId } = require('./utils');
const { messagePrefix } = require('@ethersproject/hash');

describe.only('ClaimManager.sol', () => {
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

	// ACCOUNTS
	let owner;
	let oracle;
	let claimant;

	// CONSTANTS
	let bountyId = 'mockIssueId';
	let mockOrg = 'mock-org';

	// INIT OPERATIONS
	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredBountyInitOperation;

	// CLOSER DATA
	let abiCoder;

	let abiEncodedSingleCloserData;
	let abiEncodedOngoingCloserData;
	let abiEncodedTieredCloserData;

	let BountyV1;

	beforeEach(async () => {
		const OpenQImplementation = await ethers.getContractFactory('OpenQV1');
		const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');
		const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
		const DepositManager = await ethers.getContractFactory('DepositManager');
		const ClaimManager = await ethers.getContractFactory('ClaimManager');

		const BountyFactory = await ethers.getContractFactory('BountyFactory');
		const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
		BountyV1 = await ethers.getContractFactory('BountyV1');

		[owner, claimant, oracle, claimantSecondPlace] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize();

		mockLink = await MockLink.deploy();
		await mockLink.deployed();

		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		blacklistedMockDai = await MockDai.deploy();
		await blacklistedMockDai.deployed();

		mockNft = await MockNft.deploy();
		await mockNft.deployed();

		claimManager = await ClaimManager.deploy();
		await claimManager.deployed();

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

		depositManager = await DepositManager.deploy();
		await depositManager.deployed();
		await depositManager.initialize();

		claimManager = await ClaimManager.deploy();
		await claimManager.deployed();
		await claimManager.initialize(oracle.address);

		await openQProxy.setBountyFactory(bountyFactory.address);
		await depositManager.setTokenWhitelist(openQTokenWhitelist.address);
		await openQProxy.setDepositManager(depositManager.address);
		await openQProxy.setClaimManager(claimManager.address);

		abiCoder = new ethers.utils.AbiCoder;

		const atomicBountyAbiEncodedParams = abiCoder.encode(["bool", "address", "uint256"], [true, mockLink.address, 1000]);
		atomicBountyInitOperation = [0, atomicBountyAbiEncodedParams];

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256"], [mockLink.address, '100', true, mockLink.address, 1000]);
		ongoingBountyInitOperation = [1, abiEncodedParams];

		const tieredAbiEncodedParams = abiCoder.encode(["uint256[]", "bool", "address", "uint256"], [[60, 30, 10], true, mockLink.address, 1000]);
		tieredBountyInitOperation = [2, tieredAbiEncodedParams];

		abiEncodedSingleCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedOngoingCloserData = abiCoder.encode(['address', 'string', 'address', 'string'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
		abiEncodedTieredCloserData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);
	});

	describe.only('bountyIsClaimable', () => {
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

		describe('TIERED', () => {
			it('should return TRUE if competition bounty is closed, FALSE if competition bounty is open', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ASSUME
				let bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(false);

				// ACT
				await openQProxy.closeCompetition(bountyId);

				// ASSERT
				bountyIsClaimable = await claimManager.bountyIsClaimable(bountyAddress);
				expect(bountyIsClaimable).to.equal(true);
			});
		});
	});

	describe('claimBounty', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ Oracle', async () => {
				// ASSERT
				await expect(openQProxy.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('Oraclize: caller is not the current OpenQ Oracle');
			});

			it('should revert if bounty is already closed', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				// ASSERT
				await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData)).to.be.revertedWith('BOUNTY_IS_NOT_CLAIMABLE');
			});
		});

		describe('bounty updates after claim', () => {
			it('should close issue after successful claim', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const openBounty = await openQProxy.bountyIsOpen(bountyId);
				expect(openBounty).to.equal(true);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData);

				// ASSERT
				const closedBounty = await openQProxy.bountyIsOpen(bountyId);
				expect(closedBounty).to.equal(false);
			});

			it('should set closer to the claimer address', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

				const newBounty = await Bounty.attach(
					bountyAddress
				);

				const closer = await newBounty.closer();
				expect(closer).to.equal(ethers.constants.AddressZero);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData);

				// ASSERT
				const newCloser = await newBounty.closer();
				expect(newCloser).to.equal(owner.address);
			});

			it('should set close time correctly', async () => {
				// ARRANGE
				// ASSUME
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				const Bounty = await ethers.getContractFactory('BountyV1');

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
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData);

				// ASSERT
				const newCloser = await newBounty.closer();
				expect(newCloser).to.equal(owner.address);
			});
		});

		describe('transfer', () => {
			describe('SINGLE', () => {
				it('should transfer all assets from bounty contract to claimer', async () => {
					// ARRANGE
					const volume = 100;
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);

					await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);
					await openQProxy.fundBountyToken(bountyId, mockDai.address, volume, 1);
					await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

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
					const oracleContract = openQProxy.connect(oracle);
					await oracleContract.claimBounty(bountyId, claimer.address, abiEncodedSingleCloserData);

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

				it('should transfer all NFT assets from bounty contract to claimer', async () => {
					// ASSUME
					expect(await mockNft.ownerOf(1)).to.equal(owner.address);

					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					// ACT
					const oracleContract = openQProxy.connect(oracle);
					await oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData);

					// ASSERT
					expect(await mockNft.ownerOf(1)).to.equal(owner.address);
				});
			});

			describe('ONGOING', () => {
				it('should transfer payoutAmount from bounty pool to claimant', async () => {
					// ARRANGE
					const volume = 1000;
					const expectedTimestamp = await setNextBlockTimestamp();
					const [, claimer] = await ethers.getSigners();

					await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);

					const bountyIsOpen = await openQProxy.bountyIsOpen(bountyId);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const Bounty = await ethers.getContractFactory('BountyV1');

					const newBounty = await Bounty.attach(
						bountyAddress
					);

					await mockLink.approve(bountyAddress, 10000000);

					await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);

					// ACT
					const oracleContract = openQProxy.connect(oracle);
					await oracleContract.claimBounty(bountyId, claimer.address, abiEncodedOngoingCloserData);

					// ASSERT
					const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
					expect(newBountyMockTokenBalance).to.equal('900');

					const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
					expect(newClaimerMockTokenBalance).to.equal('100');
				});
			});
		});

		describe('Event Emissions', () => {
			describe('SINGLE', () => {
				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 100;

					await mockLink.approve(bountyAddress, 10000000);
					await mockDai.approve(bountyAddress, 10000000);
					await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);
					await openQProxy.fundBountyToken(bountyId, ethers.constants.AddressZero, volume, 1, { value: volume });

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT
					const oracleContract = openQProxy.connect(oracle);
					await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData))
						.to.emit(openQProxy, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, volume, 0, abiEncodedSingleCloserData, 1)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockDai.address, volume, 0, abiEncodedSingleCloserData, 1)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, ethers.constants.AddressZero, volume, 0, abiEncodedSingleCloserData, 1);
				});

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockNft.approve(bountyAddress, 1);
					await openQProxy.fundBountyNFT(bountyId, mockNft.address, 1, 1, 0);

					// Closer data for 2nd and 3rd place
					let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT
					const oracleContract = openQProxy.connect(oracle);
					await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData))
						.to.emit(openQProxy, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockNft.address, 1, 0, abiEncodedSingleCloserData, 1);
				});
			});

			describe('ONGOING', () => {
				it('should emit a TokenBalanceClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, ongoingBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					const volume = 1000;
					const bounty = BountyV1.attach(bountyAddress);
					const payoutVolume = await bounty.payoutVolume();

					await mockLink.approve(bountyAddress, 10000000);
					await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT
					const oracleContract = openQProxy.connect(oracle);
					await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedOngoingCloserData))
						.to.emit(openQProxy, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, payoutVolume, 1, abiEncodedOngoingCloserData, 1);
				});
			});

			describe('TIERED', () => {
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
					await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);
					await openQProxy.fundBountyToken(bountyId, mockDai.address, volume, 1);

					await openQProxy.closeCompetition(bountyId);

					const expectedTimestamp = await setNextBlockTimestamp();
					// ACT
					// ASSERT
					const oracleContract = openQProxy.connect(oracle);
					await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedTieredCloserData))
						.to.emit(openQProxy, 'TokenBalanceClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockLink.address, payoutAmount, 2, abiEncodedTieredCloserData, 1)
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockDai.address, payoutAmount, 2, abiEncodedTieredCloserData, 1);
				});

				it('should emit an NftClaimed event with correct parameters', async () => {
					// ARRANGE
					await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
					const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

					await mockNft.approve(bountyAddress, 1);
					await openQProxy.fundBountyNFT(bountyId, mockNft.address, 1, 1, 0);

					// Closer data for 2nd and 3rd place
					let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);

					await openQProxy.closeCompetition(bountyId);

					const expectedTimestamp = await setNextBlockTimestamp();

					// ACT/ASSERT
					const oracleContract = openQProxy.connect(oracle);
					await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedTieredCloserDataFirstPlace))
						.to.emit(openQProxy, 'NFTClaimed')
						.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, mockNft.address, 1, 2, abiEncodedTieredCloserDataFirstPlace, 1);
				});
			});

			it('should emit a Claim event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT
				const oracleContract = openQProxy.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData))
					.to.emit(openQProxy, 'ClaimSuccess')
					.withArgs(expectedTimestamp, 0, abiEncodedSingleCloserData, 1);
			});

			it('should emit a BountyClosed event with correct parameters', async () => {
				// ARRANGE
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);
				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				// ASSERT
				const oracleContract = openQProxy.connect(oracle);
				await expect(oracleContract.claimBounty(bountyId, owner.address, abiEncodedSingleCloserData))
					.to.emit(openQProxy, 'BountyClosed')
					.withArgs(bountyId, bountyAddress, mockOrg, owner.address, expectedTimestamp, 0, abiEncodedSingleCloserData, 1);
			});
		});

		describe('ONGOING', () => {
			it('should transfer payoutVolume of payoutTokenAddress from bounty to claimant', async () => {
				// ARRANGE
				const volume = 100;
				await openQProxy.mintBounty(bountyId, mockOrg, atomicBountyInitOperation);

				const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);

				await mockLink.approve(bountyAddress, 10000000);

				await openQProxy.fundBountyToken(bountyId, mockLink.address, volume, 1);

				const [, claimer] = await ethers.getSigners();

				// ASSUME
				const bountyMockLinkTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(bountyMockLinkTokenBalance).to.equal('100');

				const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// // // ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, claimer.address, abiEncodedSingleCloserData);

				// // ASSERT
				const newBountyMockTokenBalance = (await mockLink.balanceOf(bountyAddress)).toString();
				expect(newBountyMockTokenBalance).to.equal('0');

				const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('100');
			});
		});

		describe('TIERED', () => {
			it('should transfer NFT assets with tokenId corresponding to the tier the claimant won', async () => {
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
				await openQProxy.fundBountyNFT(bountyId, mockNft.address, FIRST_PLACE_NFT, 1, 0);
				await openQProxy.fundBountyNFT(bountyId, mockNft.address, SECOND_PLACE_NFT, 1, 1);

				// Close competition to allow for claiming
				await openQProxy.closeCompetition(bountyId);

				// Closer data for 2nd and 3rd place
				let abiEncodedTieredCloserDataFirstPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 0]);
				let abiEncodedTieredCloserDataSecondPlace = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [owner.address, "FlacoJones", owner.address, "https://github.com/OpenQDev/OpenQ-Frontend/pull/398", 1]);

				// ACT
				const oracleContract = openQProxy.connect(oracle);
				await oracleContract.claimBounty(bountyId, claimant.address, abiEncodedTieredCloserDataFirstPlace);
				await oracleContract.claimBounty(bountyId, claimantSecondPlace.address, abiEncodedTieredCloserDataSecondPlace);

				// ASSERT
				expect(await mockNft.ownerOf(FIRST_PLACE_NFT)).to.equal(claimant.address);
				expect(await mockNft.ownerOf(SECOND_PLACE_NFT)).to.equal(claimantSecondPlace.address);
			});
		});
	});

	describe('tierClaimed', () => {
		it('should return FALSE if tier not claimed, TRUE if already claimed', async () => {
			// ARRANGE
			await openQProxy.mintBounty(bountyId, mockOrg, tieredBountyInitOperation);
			const bountyAddress = await openQProxy.bountyIdToAddress(bountyId);
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await openQProxy.fundBountyToken(bountyId, mockLink.address, 10000000, 1);

			await openQProxy.closeCompetition(bountyId);

			// ASSUME
			let tierClaimed = await openQProxy.tierClaimed(bountyId, 1);
			expect(tierClaimed).to.equal(false);

			// ACT
			const oracleContract = openQProxy.connect(oracle);
			await oracleContract.claimBounty(bountyId, owner.address, abiEncodedTieredCloserData);

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
			const Bounty = await ethers.getContractFactory('BountyV1');
			const bounty = await Bounty.attach(bountyAddress);

			await mockLink.approve(bountyAddress, 10000000);
			await openQProxy.fundBountyToken(bountyId, mockLink.address, 10000000, 1);

			let claimantId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");

			// ASSUME
			let ongoingClaimed = await bounty.claimantId(claimantId);
			expect(ongoingClaimed).to.equal(false);

			// ACT
			const oracleContract = openQProxy.connect(oracle);
			await oracleContract.claimBounty(bountyId, owner.address, abiEncodedOngoingCloserData);

			// // ASSERT
			ongoingClaimed = await bounty.claimantId(claimantId);
			expect(ongoingClaimed).to.equal(true);
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