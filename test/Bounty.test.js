/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const { generateDepositId, generateClaimantId } = require('./utils');

describe.only('BountyV3.sol', () => {
	// CONTRACT FACTORIES
	let BountyV3;

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
	const mockId = "mockId";
	const organization = "mockOrg";
	const mockOpenQId = "mockOpenQId";

	// BOUNTY TYPES
	let ATOMIC_CONTRACT = 0;
	let ONGOING_CONTRACT = 1;
	let TIERED_CONTRACT = 2;
	let TIERED_FIXED_CONTRACT = 3;

	// INITIALIZATION OPERATIONS
	let atomicBountyInitOperation;
	let ongoingBountyInitOperation;
	let tieredBountyInitOperation;
	let tieredFixedBountyInitOperation;

	// TEST CONTRACTS
	let atomicContract;
	let atomicContract_noFundingGoal;
	let ongoingContract;
	let tieredContract;
	let tieredFixedContract;

	// MISC
	let initializationTimestampAtomic;
	let initializationTimestampAtomicNoFundingGoal;
	let initializationTimestampOngoing;
	let initializationTimestampTiered;
	let initializationTimestampTieredFixed;

	beforeEach(async () => {
		BountyV3 = await ethers.getContractFactory('BountyV3');
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

		// ATOMIC CONTRACT W/ FUNDING GOAL
		atomicContract = await BountyV3.deploy();
		await atomicContract.deployed();
		let abiEncodedParamsFundingGoalBounty = abiCoder.encode(["bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [true, mockLink.address, 100, true, true, true, mockOpenQId, "", ""]);
		atomicBountyInitOperation = [ATOMIC_CONTRACT, abiEncodedParamsFundingGoalBounty];
		initializationTimestamp = await setNextBlockTimestamp();
		await atomicContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation);

		await mockNft.approve(atomicContract.address, 0);
		await mockNft.approve(atomicContract.address, 1);
		await mockNft.approve(atomicContract.address, 2);
		await mockNft.approve(atomicContract.address, 3);
		await mockNft.approve(atomicContract.address, 4);
		await mockNft.approve(atomicContract.address, 5);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(atomicContract.address, 10000000);
		await mockDai.approve(atomicContract.address, 10000000);

		// ATOMIC CONTRACT W/ NO FUNDING GOAL
		atomicContract_noFundingGoal = await BountyV3.deploy();
		await atomicContract_noFundingGoal.deployed();
		let abiEncodedParamsNoFundingGoalBounty = abiCoder.encode(["bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [false, ethers.constants.AddressZero, 0, true, true, true, mockOpenQId, "", ""]);
		atomicBountyNoFundingGoalInitOperation = [ATOMIC_CONTRACT, abiEncodedParamsNoFundingGoalBounty];
		initializationTimestampAtomicNoFundingGoal = await setNextBlockTimestamp();
		await atomicContract_noFundingGoal.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyNoFundingGoalInitOperation);

		// ONGOING BOUNTY
		ongoingContract = await BountyV3.deploy();
		await ongoingContract.deployed();

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [mockLink.address, '100', true, mockLink.address, '100', true, true, true, mockOpenQId, "", ""]);

		ongoingBountyInitOperation = [ONGOING_CONTRACT, abiEncodedParams];

		initializationTimestampOngoing = await setNextBlockTimestamp();
		await ongoingContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, ongoingBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(ongoingContract.address, 10000000);
		await mockDai.approve(ongoingContract.address, 10000000);

		// TIERED BOUNTY
		tieredContract = await BountyV3.deploy();
		await tieredContract.deployed();

		const abiEncodedParamsTieredBounty = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[80, 20], true, mockLink.address, '100', true, true, true, mockOpenQId, "", ""]);

		tieredBountyInitOperation = [TIERED_CONTRACT, abiEncodedParamsTieredBounty];

		initializationTimestampTiered = await setNextBlockTimestamp();
		await tieredContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredContract.address, 10000000);
		await mockDai.approve(tieredContract.address, 10000000);

		// TIERED FIXED BOUNTY
		tieredFixedContract = await BountyV3.deploy();
		await tieredFixedContract.deployed();

		const abiEncodedParamsTieredFixedBounty = abiCoder.encode(["uint256[]", "address", "bool", "bool", "bool", "string", "string", "string"], [[100, 50], mockLink.address, true, true, true, mockOpenQId, "", ""]);

		tieredFixedBountyInitOperation = [TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];

		initializationTimestampTieredFixed = await setNextBlockTimestamp();
		await tieredFixedContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredFixedContract.address, 10000000);
		await mockDai.approve(tieredFixedContract.address, 10000000);
	});

	describe('initializer', () => {
		describe('ATOMIC', () => {
			it(`should initialize bounty with correct metadata`, async () => {
				// ARRANGE/ASSERT
				await expect(await atomicContract.bountyId()).equals(mockId);
				await expect(await atomicContract.issuer()).equals(owner.address);
				await expect(await atomicContract.organization()).equals(organization);
				await expect(await atomicContract.status()).equals(0);
				await expect(await atomicContract.openQ()).equals(owner.address);
				await expect(await atomicContract.claimManager()).equals(claimManager.address);
				await expect(await atomicContract.depositManager()).equals(depositManager.address);
				await expect(await atomicContract.bountyCreatedTime()).equals(initializationTimestamp);
				await expect(await atomicContract.bountyType()).equals(ATOMIC_CONTRACT);
				await expect(await atomicContract.hasFundingGoal()).equals(true);
				await expect(await atomicContract.fundingToken()).equals(mockLink.address);
				await expect(await atomicContract.fundingGoal()).equals(100);
				await expect(await atomicContract.invoiceable()).equals(true);
				await expect(await atomicContract.kycRequired()).equals(true);
				await expect(await atomicContract.externalUserId()).equals(mockOpenQId);
				await expect(await atomicContract.supportingDocuments()).equals(true);
				await expect(await atomicContract.invoiceComplete()).equals(false);
				await expect(await atomicContract.supportingDocumentsComplete()).equals(false);
			});
		});

		describe('ONGOING', () => {
			it('should init with correct payoutTokenAddress, payoutVolume, bountyType, hasFundingGoal, fundingToken, and fundingGoal', async () => {
				await expect(await ongoingContract.bountyId()).equals(mockId);
				await expect(await ongoingContract.issuer()).equals(owner.address);
				await expect(await ongoingContract.organization()).equals(organization);
				await expect(await ongoingContract.status()).equals(0);
				await expect(await ongoingContract.openQ()).equals(owner.address);
				await expect(await ongoingContract.claimManager()).equals(claimManager.address);
				await expect(await ongoingContract.depositManager()).equals(depositManager.address);
				await expect(await ongoingContract.bountyCreatedTime()).equals(initializationTimestampOngoing);
				await expect(await ongoingContract.bountyType()).equals(ONGOING_CONTRACT);
				await expect(await ongoingContract.hasFundingGoal()).equals(true);
				await expect(await ongoingContract.fundingToken()).equals(mockLink.address);
				await expect(await ongoingContract.fundingGoal()).equals(100);
				await expect(await ongoingContract.payoutTokenAddress()).equals(mockLink.address);
				await expect(await ongoingContract.payoutVolume()).equals(100);
				await expect(await ongoingContract.invoiceable()).equals(true);
				await expect(await ongoingContract.kycRequired()).equals(true);
				await expect(await ongoingContract.externalUserId()).equals(mockOpenQId);
				await expect(await ongoingContract.supportingDocuments()).equals(true);
				await expect(await ongoingContract.invoiceComplete()).equals(false);
				await expect(await ongoingContract.supportingDocumentsComplete()).equals(false);
			});
		});

		describe('TIERED', () => {
			it('should init with tiered correct metadata', async () => {
				const actualBountyPayoutSchedule = await tieredContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());


				await expect(await tieredContract.bountyId()).equals(mockId);
				await expect(await tieredContract.issuer()).equals(owner.address);
				await expect(await tieredContract.organization()).equals(organization);
				await expect(await tieredContract.status()).equals(0);
				await expect(await tieredContract.openQ()).equals(owner.address);
				await expect(await tieredContract.claimManager()).equals(claimManager.address);
				await expect(await tieredContract.depositManager()).equals(depositManager.address);
				await expect(await tieredContract.bountyCreatedTime()).equals(initializationTimestampTiered);
				await expect(await tieredContract.bountyType()).equals(TIERED_CONTRACT);
				await expect(await tieredContract.hasFundingGoal()).equals(true);
				await expect(await tieredContract.fundingToken()).equals(mockLink.address);
				await expect(await tieredContract.fundingGoal()).equals(100);
				await expect(payoutToString[0]).equals("80");
				await expect(payoutToString[1]).equals("20");
				await expect(await tieredContract.invoiceable()).equals(true);
				await expect(await tieredContract.kycRequired()).equals(true);
				await expect(await tieredContract.externalUserId()).equals(mockOpenQId);
				await expect(await tieredContract.supportingDocuments()).equals(true);
				await expect(await tieredContract.invoiceComplete()).equals(false);
				await expect(await tieredContract.supportingDocumentsComplete()).equals(false);
			});

			it('should revert if payoutSchedule values do not add up to 100', async () => {
				// ARRANGE
				tieredContract = await BountyV3.deploy();
				await tieredContract.deployed();

				const abiEncodedParamsTieredBountyNot100 = abiCoder.encode(["uint256[]", "bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [[1, 2], true, mockLink.address, 100, true, true, true, mockOpenQId, "", ""]);

				tieredBountyInitOperation = [2, abiEncodedParamsTieredBountyNot100];

				// ACT/ASSERT
				await expect(tieredContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredBountyInitOperation)).to.be.revertedWith('PAYOUT_SCHEDULE_MUST_ADD_TO_100');
			});
		});

		describe('TIERED FIXED', () => {
			it('should init with tiered and payout schedule, payoutTokenAddress', async () => {
				const actualBountyPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

				await expect(await tieredFixedContract.bountyId()).equals(mockId);
				await expect(await tieredFixedContract.issuer()).equals(owner.address);
				await expect(await tieredFixedContract.organization()).equals(organization);
				await expect(await tieredFixedContract.status()).equals(0);
				await expect(await tieredFixedContract.openQ()).equals(owner.address);
				await expect(await tieredFixedContract.claimManager()).equals(claimManager.address);
				await expect(await tieredFixedContract.depositManager()).equals(depositManager.address);
				await expect(await tieredFixedContract.bountyCreatedTime()).equals(initializationTimestampTieredFixed);
				await expect(await tieredFixedContract.bountyType()).equals(TIERED_FIXED_CONTRACT);
				await expect(await tieredFixedContract.hasFundingGoal()).equals(false);
				await expect(payoutToString[0]).equals("100");
				await expect(payoutToString[1]).equals("50");
				await expect(await tieredFixedContract.invoiceable()).equals(true);
				await expect(await tieredFixedContract.kycRequired()).equals(true);
				await expect(await tieredFixedContract.externalUserId()).equals(mockOpenQId);
				await expect(await tieredFixedContract.supportingDocuments()).equals(true);
				await expect(await tieredFixedContract.invoiceComplete()).equals(false);
				await expect(await tieredFixedContract.supportingDocumentsComplete()).equals(false);
			});
		});

		describe('REVERTS', () => {
			it('should revert if bountyId is empty', async () => {
				// ARRANGE
				const BountyV3 = await ethers.getContractFactory('BountyV3');
				atomicContract = await BountyV3.deploy();

				// ASSERT
				await expect(atomicContract.initialize("", owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
			});

			it('should revert if organization is empty', async () => {
				// ARRANGE
				const BountyV3 = await ethers.getContractFactory('BountyV3');
				atomicContract = await BountyV3.deploy();

				// ASSERT
				await expect(atomicContract.initialize(mockId, owner.address, "", owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
			});

			it('should revert if given an invalid operaion', async () => {
				// ARRANGE
				const BountyV3 = await ethers.getContractFactory('BountyV3');
				atomicContract = await BountyV3.deploy();

				// ASSERT
				await expect(atomicContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, [42, []])).to.be.revertedWith('OQ: unknown init operation type');
			});
		});
	});

	describe('receiveFunds', () => {
		describe('REVERTS', () => {
			it('should revert if not called by Deposit Manager contract', async () => {
				// ARRANGE
				const [, , , , notDepositManager] = await ethers.getSigners();

				// ASSERT
				await expect(atomicContract.connect(notDepositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays)).to.be.revertedWith('DepositManagerOwnable: caller is not the current OpenQ Deposit Manager');
			});

			it('should revert if no volume is sent', async () => {
				// ASSERT
				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 0, thirtyDays)).to.be.revertedWith('ZERO_VOLUME_SENT');
			});

			it('should revert if funder tries to send more than allowance', async () => {
				const greaterThanAllowance = 100000000;
				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, greaterThanAllowance, thirtyDays)).to.be.revertedWith('ERC20: insufficient allowance');
			});

			it('should revert if expiration is negative', async () => {
				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, 0)).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});

			it('should revert if bounty is closed', async () => {
				// ARRANGE
				const volume = 1000;
				await atomicContract.connect(claimManager).close(owner.address, []);
				await tieredContract.connect(claimManager).closeCompetition();
				await ongoingContract.closeOngoing(owner.address);

				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('CONTRACT_IS_CLOSED');
				await expect(ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('CONTRACT_IS_CLOSED');
				await expect(tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('CONTRACT_IS_CLOSED');
			});
		});

		describe('DEPOSIT INITIALIZATION', () => {
			it(`should initialize token deposit data with correct metadata`, async () => {
				// ARRANGE
				const depositId = generateDepositId(mockId, 0);
				const expectedTimestamp = await setNextBlockTimestamp();

				// ACT
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);

				// ASSERT
				expect(await atomicContract.funder(depositId)).to.equal(owner.address);
				expect(await atomicContract.tokenAddress(depositId)).to.equal(mockLink.address);
				expect(await atomicContract.volume(depositId)).to.equal(100);
				expect(await atomicContract.expiration(depositId)).to.equal(thirtyDays);
				expect(await atomicContract.isNFT(depositId)).to.equal(false);
				expect(await atomicContract.depositTime(depositId)).to.equal(expectedTimestamp);
			});

			it('should create a globally unique deposit id across all bounties', async () => {
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
				const deposits = await atomicContract.getDeposits();
				const depositId = deposits[0];

				const newBounty = await BountyV3.deploy();
				await newBounty.deployed();
				await newBounty.initialize('other-mock-id', owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation);

				await mockLink.approve(newBounty.address, 20000);
				await newBounty.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
				const newDeposits = await newBounty.getDeposits();
				const newDepositId = newDeposits[0];

				expect(newDepositId).to.not.equal(depositId);
			});
		});

		describe('TOKEN ADDRESSES', () => {
			it('should add funding address to token address set', async () => {
				// ACT
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);

				const tokenAddresses = await atomicContract.getTokenAddresses();
				expect(tokenAddresses.length).to.equal(1);
				expect(tokenAddresses[0]).to.equal(mockLink.address);
			});
		});

		describe('ERC20 TRANSFER', () => {
			describe('NO FEE TRANSFER', () => {
				it('should transfer volume of ERC20 from sender to bounty', async () => {
					// ASSUME
					const initialFunderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
					const initialFunderMockDaiBalance = (await mockLink.balanceOf(owner.address)).toString();
					expect(initialFunderMockLinkBalance).to.equal('10000000000000000000000');
					expect(initialFunderMockDaiBalance).to.equal('10000000000000000000000');

					const initialIssueMockLinkBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
					const initialIssueMockDaiBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
					expect(initialIssueMockLinkBalance).to.equal('0');
					expect(initialIssueMockDaiBalance).to.equal('0');

					// ARRANGE
					const value = 100;

					// ACT
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, value, thirtyDays);
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, value, thirtyDays);

					// ASSERT
					const funderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
					const funderFakeTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
					expect(funderMockLinkBalance).to.equal('9999999999999999999900');
					expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

					const bountyMockTokenBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
					const bountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
					expect(bountyMockTokenBalance).to.equal('100');
					expect(bountyFakeTokenBalance).to.equal('100');
				});
			});

			describe('FEE TRANSFER', () => {
				it('should transfer volume of ERC20 from sender to bounty MINUS whatever the ERC20 takes in fees', async () => {
					// ASSUME
					const initialFunderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
					const initialFunderMockDaiBalance = (await mockLink.balanceOf(owner.address)).toString();
					expect(initialFunderMockLinkBalance).to.equal('10000000000000000000000');
					expect(initialFunderMockDaiBalance).to.equal('10000000000000000000000');

					const initialIssueMockLinkBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
					const initialIssueMockDaiBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
					expect(initialIssueMockLinkBalance).to.equal('0');
					expect(initialIssueMockDaiBalance).to.equal('0');

					// ARRANGE
					const value = 100;

					// ACT
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, value, thirtyDays);
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, value, thirtyDays);

					// ASSERT
					const funderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
					const funderFakeTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
					expect(funderMockLinkBalance).to.equal('9999999999999999999900');
					expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

					const bountyMockTokenBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
					const bountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
					expect(bountyMockTokenBalance).to.equal('100');
					expect(bountyFakeTokenBalance).to.equal('100');
				});
			});
		});

		describe('PROTOCOL TOKEN TRANSFER', () => {
			it('should accept msg.value if token address is zero address', async () => {
				const volume = ethers.utils.parseEther("1.0");
				await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, thirtyDays, { value: volume });
				const bountyProtocolTokenBalance = await atomicContract.provider.getBalance(atomicContract.address);
				expect(bountyProtocolTokenBalance).to.equal(volume);
			});
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
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 2, 1, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 3, 1, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 4, 1, 0);

				// ASSERT
				await expect(atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 5, 1, 0)).to.be.revertedWith('NFT_DEPOSIT_LIMIT_REACHED');
			});

			it('should revert if expiration is negative', async () => {
				await expect(atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 0, 0)).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});
		});

		describe('DEPOSIT INITIALIZATION', () => {
			it(`should initialize nft deposit data with correct metadata`, async () => {

				// ACT
				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, thirtyDays, 1);

				// ASSERT
				expect(await atomicContract.funder(depositId)).to.equal(owner.address);
				expect(await atomicContract.tokenAddress(depositId)).to.equal(mockNft.address);
				expect(await atomicContract.tokenId(depositId)).to.equal(1);
				expect(await atomicContract.expiration(depositId)).to.equal(thirtyDays);
				expect(await atomicContract.isNFT(depositId)).to.equal(true);
				expect(await atomicContract.tier(depositId)).to.equal(1);

				const depositTime = await atomicContract.depositTime(depositId);
				expect(depositTime.toString()).to.equal(expectedTimestamp.toString());
			});
		});

		describe('transfer', () => {
			it('should transfer NFT from owner to bounty contract', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);

				// ACT
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 0, 1, 0);

				// ASSERT
				expect(await mockNft.ownerOf(0)).to.equal(atomicContract.address);
			});
		});
	});

	describe('refundDeposit', () => {

		describe('REVERTS', () => {
			it('should revert if not called by Deposit Manager contract', async () => {
				// ARRANGE
				const [, , , , , notDepositManager] = await ethers.getSigners();
				let issueWithNonOwnerAccount = atomicContract.connect(notDepositManager);

				const mockDepositId = generateDepositId(owner.address, mockLink.address, 123);

				// ASSERT
				await expect(issueWithNonOwnerAccount.refundDeposit(mockDepositId, owner.address, 100)).to.be.revertedWith('DepositManagerOwnable: caller is not the current OpenQ Deposit Manager');
			});

			it('should revert if called before expiration', async () => {
				// ARRANGE
				const volume = 100;

				// ASSUME
				const linkDepositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, 10000);

				// ACT
				await expect(atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address, volume)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});
		});

		describe('refunded', () => {
			it('should set deposit refunded to true on refund', async () => {
				// ARRANGE
				const volume = 100;

				// ASSUME
				const linkDepositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, 1);
				expect(await atomicContract.refunded(linkDepositId)).to.equal(false);

				const daiDepositId = generateDepositId(mockId, 1);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, volume, 1);
				expect(await atomicContract.refunded(daiDepositId)).to.equal(false);

				const protocolDepositId = generateDepositId(mockId, 2);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });
				expect(await atomicContract.refunded(protocolDepositId)).to.equal(false);

				// ACT
				await atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address, volume);
				await atomicContract.connect(depositManager).refundDeposit(daiDepositId, owner.address, volume);
				await atomicContract.connect(depositManager).refundDeposit(protocolDepositId, owner.address, volume);

				// ASSERT
				expect(await atomicContract.refunded(linkDepositId)).to.equal(true);
				expect(await atomicContract.refunded(daiDepositId)).to.equal(true);
				expect(await atomicContract.refunded(protocolDepositId)).to.equal(true);
			});
		});

		describe('transfer', () => {
			it('should transfer refunded ERC20 and protocol token asset from bounty contract to funder', async () => {
				// ARRANGE
				const volume = 100;

				const linkDepositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, 1);

				const daiDepositId = generateDepositId(mockId, 1);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, volume, 1);

				const protocolDepositId = generateDepositId(mockId, 2);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
				const bountyProtocolTokenBalance = (await ethers.provider.getBalance(atomicContract.address)).toString();

				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
				expect(bountyProtocolTokenBalance).to.equal('100');

				const funderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(funderMockLinkBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				// // // ACT
				await atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address, volume);
				await atomicContract.connect(depositManager).refundDeposit(daiDepositId, owner.address, volume);

				// // // // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(atomicContract.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(atomicContract.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');

				const newFunderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const newFunderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(newFunderMockLinkBalance).to.equal('10000000000000000000000');
				expect(newFunderFakeTokenBalance).to.equal('10000000000000000000000');
			});

			it('should transfer NFT from bounty to sender', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				const depositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, 0);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(atomicContract.address);

				// ACT
				await atomicContract.connect(depositManager).refundDeposit(depositId, owner.address, 0);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
		});
	});

	describe('extendDeposit', () => {
		it('should extend deposit expiration by _seconds', async () => {
			// ARRANGE
			const volume = 100;

			// ASSUME
			const linkDepositId = generateDepositId(mockId, 0);
			await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, 1);

			// ACT
			await atomicContract.connect(depositManager).extendDeposit(linkDepositId, 1000, owner.address);

			// ASSERT
			// This will fail to revert without a deposit extension. Cannot test the counter case due to the inability to call refund twice, see DEPOSIT_ALREADY_REFUNDED
			await expect(atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address, volume)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
		});
	});

	describe('claimBalance', () => {
		describe('ATOMIC', () => {
			it('should transfer protocol token from contract to payout address and set token balance to zero', async () => {
				// ARRANGE
				const volume = 100;

				const [, claimer] = await ethers.getSigners();
				const initialClaimerProtocolBalance = (await atomicContract.provider.getBalance(claimer.address));

				await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, thirtyDays, { value: volume });

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

				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockDai.address, volume, thirtyDays);

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

		describe('ONGOING', () => {
			it('should transfer payoutVolume of payoutTokenAddress to claimant', async () => {
				// ARRANGE
				const volume = 300;

				const [, claimer] = await ethers.getSigners();

				await ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await atomicContract.getDeposits();
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
				await ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 10000000, thirtyDays);


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

		describe('TIERED', () => {
			it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await tieredContract.getDeposits();
				const linkDepositId = deposits[0];

				await tieredContract.connect(claimManager).closeCompetition();

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredContract.address)).toString();
				expect(bountyMockTokenBalance).to.equal('1000');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ACT
				await tieredContract.connect(claimManager).claimTiered(firstPlace.address, 0, mockLink.address);

				// // // ASSERT
				// const newClaimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				// expect(newClaimerMockTokenBalance).to.equal('800');

				// // ACT
				// await tieredContract.connect(claimManager).claimTiered(secondPlace.address, 1, mockLink.address);

				// // // ASSERT
				// const secondPlaceMockTokenBalance = (await mockLink.balanceOf(secondPlace.address)).toString();
				// expect(secondPlaceMockTokenBalance).to.equal('200');
			});

			it('should revert if not called by claim manager', async () => {
				// ACT/ASSERT
				await expect(tieredContract.claimTieredFixed(owner.address, 0)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
			});

			it('should revert if competition is not TIERED', async () => {
				// ACT/ASSERT
				await tieredFixedContract.connect(claimManager).closeCompetition();
				await expect(tieredFixedContract.connect(claimManager).claimTiered(owner.address, 0, mockLink.address)).to.be.revertedWith('NOT_A_TIERED_BOUNTY');
			});
		});

		describe('TIERED FIXED', () => {
			it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
				// ARRANGE
				const volume = 150;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredFixedContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredFixedContract.address)).toString();
				expect(bountyMockTokenBalance).to.equal('150');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				await tieredFixedContract.connect(claimManager).closeCompetition();
				// ACT
				await tieredFixedContract.connect(claimManager).claimTieredFixed(firstPlace.address, 0);

				// // ASSERT
				const newClaimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('100');

				// ACT
				await tieredFixedContract.connect(claimManager).claimTieredFixed(secondPlace.address, 1);

				// // ASSERT
				const secondPlaceMockTokenBalance = (await mockLink.balanceOf(secondPlace.address)).toString();
				expect(secondPlaceMockTokenBalance).to.equal('50');
			});

			it('should revert if not called by claim manager', async () => {
				// ACT/ASSERT
				await expect(tieredFixedContract.claimTieredFixed(owner.address, 0)).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
			});

			it('should revert if competition is not TIERED FIXED', async () => {
				// ACT/ASSERT
				await tieredContract.connect(claimManager).closeCompetition();
				await expect(tieredContract.connect(claimManager).claimTieredFixed(owner.address, 0)).to.be.revertedWith('NOT_A_TIERED_FIXED_BOUNTY');
			});
		});
	});

	describe('claimNft', () => {
		describe('require and revert', () => {
			it('should revert if not called by Claim Manager contract', async () => {
				// ARRANGE
				const [, , , , , notClaimManager] = await ethers.getSigners();
				const value = 10000;
				let issueWithNonOwnerAccount = atomicContract.connect(notClaimManager);

				// ASSERT
				await expect(issueWithNonOwnerAccount.claimNft(notClaimManager.address, ethers.utils.formatBytes32String('mockDepositId'))).to.be.revertedWith('ClaimManagerOwnable: caller is not the current OpenQ Claim Manager');
			});
		});

		describe('transfer', () => {
			it('should transfer NFT deposit from bounty contract to claimer', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				const depositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, 0);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(atomicContract.address);

				// ACT
				await atomicContract.connect(claimManager).claimNft(owner.address, depositId);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
		});
	});

	describe('close', () => {
		describe('ATOMIC - close', () => {
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

		describe('ONGOING - closeCompetition', () => {
			it('should set status to 1 and bountyClosedTime', async () => {
				let bountyClosedTime = await ongoingContract.bountyClosedTime();
				let status = await ongoingContract.status();

				expect(bountyClosedTime).to.equal(0);
				expect(status).to.equal(0);

				const expectedTimestamp = await setNextBlockTimestamp();
				await ongoingContract.closeOngoing(owner.address);

				bountyClosedTime = await ongoingContract.bountyClosedTime();
				status = await ongoingContract.status();

				expect(bountyClosedTime).to.equal(expectedTimestamp);
				expect(status).to.equal(1);
			});

			it('should revert if caller is not issuer', async () => {
				const [, notOwner] = await ethers.getSigners();
				await expect(ongoingContract.closeOngoing(notOwner.address)).to.be.revertedWith('CALLER_NOT_ISSUER');
			});

			it('should revert if already closed', async () => {
				await ongoingContract.closeOngoing(owner.address);
				await expect(ongoingContract.closeOngoing(owner.address)).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
			});
		});

		describe('TIERED - closeCompetition', () => {
			it('should set bounty status to 1, freeze balances and set bountyClosedTime', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredContract.address)).toString();
				expect(bountyMockTokenBalance).to.equal('1000');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ASSUME
				let status = await tieredContract.status();
				let mockTokenFundingTotal = await tieredContract.fundingTotals(mockLink.address);
				let bountyClosedTime = await tieredContract.bountyClosedTime();

				expect(status).to.equal(0);
				expect(mockTokenFundingTotal).to.equal(0);
				expect(bountyClosedTime).to.equal(0);

				const expectedTimestamp = await setNextBlockTimestamp();
				// ACT
				await tieredContract.connect(claimManager).closeCompetition();

				// ASSERT
				status = await tieredContract.status();
				mockTokenFundingTotal = await tieredContract.fundingTotals(mockLink.address);
				bountyClosedTime = await tieredContract.bountyClosedTime();

				expect(status).to.equal(1);
				expect(mockTokenFundingTotal).to.equal(1000);
				expect(bountyClosedTime).to.equal(expectedTimestamp);
			});

			it('should revert if already closed', async () => {
				await tieredContract.connect(claimManager).closeCompetition();
				await expect(tieredContract.connect(claimManager).closeCompetition()).to.be.revertedWith('CONTRACT_ALREADY_CLOSED');
			});
		});
	});

	describe('setFundingGoal', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			const volume = 10000;
			let bountyWithNonOwnerAccount = atomicContract.connect(notOwner);

			// ASSERT
			await expect(bountyWithNonOwnerAccount.setFundingGoal(mockLink.address, volume)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set funding goal when none exists', async () => {
			// ASSUME
			let hasNoFundingGoal = await atomicContract_noFundingGoal.hasFundingGoal();
			expect(hasNoFundingGoal).to.equal(false);

			// ACT
			await atomicContract_noFundingGoal.setFundingGoal(mockLink.address, 100);

			// ASSERT
			let hasNoFundingGoalexpected = await atomicContract_noFundingGoal.hasFundingGoal();
			let fundingToken = await atomicContract_noFundingGoal.fundingToken();
			let fundingGoal = await atomicContract_noFundingGoal.fundingGoal();
			expect(hasNoFundingGoalexpected).to.equal(true);
			expect(fundingToken).to.equal(mockLink.address);
			expect(fundingToken).to.equal(mockLink.address);
		});
	});

	describe('setPayout', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			const volume = 10000;
			let bountyWithNonOwnerAccount = ongoingContract.connect(notOwner);

			// ASSERT
			await expect(bountyWithNonOwnerAccount.setPayout(mockLink.address, volume)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set payout token and volume', async () => {
			// ASSUME
			let initialTokenAddress = await ongoingContract.payoutTokenAddress();
			let initialPayoutVolume = await ongoingContract.payoutVolume();
			expect(initialTokenAddress).to.equal(mockLink.address);
			expect(initialPayoutVolume).to.equal(100);

			// ACT
			await ongoingContract.setPayout(mockDai.address, 500);

			// ASSERT
			let expectedPayoutTokenAddress = await ongoingContract.payoutTokenAddress();
			let expectedPayoutVolume = await ongoingContract.payoutVolume();
			expect(expectedPayoutTokenAddress).to.equal(mockDai.address);
			expect(expectedPayoutVolume).to.equal(500);
		});
	});

	describe('setPayoutSchedule', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredContract.connect(notOwner).setPayoutSchedule([80, 20])).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if not a percentage competition', async () => {
			// ACT / ASSERT
			await expect(tieredFixedContract.setPayoutSchedule([80, 20])).to.be.revertedWith('NOT_A_TIERED_BOUNTY');
		});

		it('should revert if payoutschedule doesnt add to 100', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredContract.connect(notOwner).setPayoutSchedule([100, 20])).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set payout schedule', async () => {
			// ASSUME
			let initialPayoutSchedule = await tieredContract.getPayoutSchedule();
			let payoutToString = initialPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('80');
			expect(payoutToString[1]).to.equal('20');

			// ACT
			await tieredContract.setPayoutSchedule([70, 20, 10]);

			// ASSERT
			let expectedPayoutSchedule = await tieredContract.getPayoutSchedule();
			payoutToString = expectedPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('70');
			expect(payoutToString[1]).to.equal('20');
			expect(payoutToString[2]).to.equal('10');
		});
	});


	describe('setPayoutScheduleFixed', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setPayoutScheduleFixed([80, 20], mockLink.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if not a fixed competition', async () => {
			// ACT / ASSERT
			await expect(tieredContract.setPayoutScheduleFixed([80, 20], mockLink.address)).to.be.revertedWith('NOT_A_FIXED_TIERED_BOUNTY');
		});

		it('should set payout schedule and payout token address', async () => {
			// ASSUME
			let initialPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			let payoutToString = initialPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('100');
			expect(payoutToString[1]).to.equal('50');

			// ACT
			await tieredFixedContract.setPayoutScheduleFixed([1000, 500, 250], mockDai.address);

			// ASSERT
			let expectedPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
			payoutToString = expectedPayoutSchedule.map(thing => thing.toString());
			expect(payoutToString[0]).to.equal('1000');
			expect(payoutToString[1]).to.equal('500');
			expect(payoutToString[2]).to.equal('250');
			expect(await tieredFixedContract.payoutTokenAddress()).to.equal(mockDai.address);
		});
	});

	describe.only('setTierWinner', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(tieredFixedContract.connect(notOwner).setPayoutScheduleFixed([80, 20], mockLink.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it.only('should set tier winner', async () => {
			// ACT
			await tieredFixedContract.setTierWinner(mockOpenQId, 0)

			// ASSERT
			const winner = await tieredFixedContract.tierWinners(0)
			expect(winner).to.equal(mockOpenQId)
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