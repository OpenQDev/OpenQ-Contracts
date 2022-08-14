/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { generateDepositId, generateClaimantId } = require('./utils');

describe('BountyV1.sol', () => {
	// CONTRACT FACTORIES
	let BountyV1;

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
	let initializationTimestamp;

	beforeEach(async () => {
		BountyV1 = await ethers.getContractFactory('BountyV1');
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

		// Mint an Atomic Contract with a Funding Goal
		atomicContract = await BountyV1.deploy();
		await atomicContract.deployed();
		let abiEncodedParamsFundingGoalBounty = abiCoder.encode(["bool", "address", "uint256"], [true, mockLink.address, 100]);
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

		// Mint an atomic contract with no funding goal
		atomicContract_noFundingGoal = await BountyV1.deploy();
		await atomicContract_noFundingGoal.deployed();
		let abiEncodedParamsNoFundingGoalBounty = abiCoder.encode(["bool", "address", "uint256"], [false, ethers.constants.AddressZero, 0]);
		atomicBountyNoFundingGoalInitOperation = [ATOMIC_CONTRACT, abiEncodedParamsNoFundingGoalBounty];
		await atomicContract_noFundingGoal.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyNoFundingGoalInitOperation);

		// Mint an Ongoing Bounty
		ongoingContract = await BountyV1.deploy();
		await ongoingContract.deployed();

		const abiEncodedParams = abiCoder.encode(["address", "uint256", "bool", "address", "uint256"], [mockLink.address, '100', true, mockLink.address, '100']);

		ongoingBountyInitOperation = [ONGOING_CONTRACT, abiEncodedParams];

		await ongoingContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, ongoingBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(ongoingContract.address, 10000000);
		await mockDai.approve(ongoingContract.address, 10000000);

		// Mint a Tiered Bounty
		tieredContract = await BountyV1.deploy();
		await tieredContract.deployed();

		const abiEncodedParamsTieredBounty = abiCoder.encode(["uint256[]", "bool", "address", "uint256"], [[80, 20], true, mockLink.address, '100']);

		tieredBountyInitOperation = [TIERED_CONTRACT, abiEncodedParamsTieredBounty];

		await tieredContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredContract.address, 10000000);
		await mockDai.approve(tieredContract.address, 10000000);

		// Mint a Tiered Fixed Bounty
		tieredFixedContract = await BountyV1.deploy();
		await tieredFixedContract.deployed();

		const abiEncodedParamsTieredFixedBounty = abiCoder.encode(["uint256[]", "address"], [[100, 50], mockLink.address]);

		tieredFixedBountyInitOperation = [TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];

		await tieredFixedContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredFixedBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredFixedContract.address, 10000000);
		await mockDai.approve(tieredFixedContract.address, 10000000);
	});

	describe('initializer', () => {
		describe('ATOMIC', () => {
			it(`should initialize bounty with correct: bountyId, issuer, organization, status, openQImplementation, bountyCreatedTime, and bountyType`, async () => {
				// ARRANGE
				const actualBountyId = await atomicContract.bountyId();
				const actualIssuer = await atomicContract.issuer();
				const actualOrganization = await atomicContract.organization();
				const actualStatus = await atomicContract.status();
				const actualOpenQ = await atomicContract.openQ();
				const actualBounyCreatedTime = await atomicContract.bountyCreatedTime();
				const actualBounyType = await atomicContract.bountyType();

				// ASSERT
				await expect(actualBountyId).equals(mockId);
				await expect(actualIssuer).equals(owner.address);
				await expect(organization).equals(organization);
				await expect(actualStatus).equals(0);
				await expect(actualOpenQ).equals(owner.address);
				await expect(actualBounyCreatedTime).equals(initializationTimestamp);
				await expect(actualBounyType).equals(0);
			});

			it('should revert if bountyId is empty', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				atomicContract = await BountyV1.deploy();

				// ASSERT
				await expect(atomicContract.initialize("", owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
			});

			it('should revert if organization is empty', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				atomicContract = await BountyV1.deploy();

				// ASSERT
				await expect(atomicContract.initialize(mockId, owner.address, "", owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
			});

			it('should revert if given an invalid operaion', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				atomicContract = await BountyV1.deploy();

				// ASSERT
				await expect(atomicContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, [42, []])).to.be.revertedWith('OQ: unknown init operation type');
			});

			it('should init with correct payoutTokenAddress, payoutVolume, and actualBountyType', async () => {
				const actualBountyType = await atomicContract.bountyType();
				const actualBountyFundingGoal = await atomicContract.fundingGoal();
				const actualBountyFundingTokenAddress = await atomicContract.fundingToken();
				const actualBountyHasFundingGoal = await atomicContract.hasFundingGoal();

				await expect(actualBountyType).equals(0);
				await expect(actualBountyFundingGoal).equals(100);
				await expect(actualBountyFundingTokenAddress).equals(mockLink.address);
				await expect(actualBountyHasFundingGoal).equals(true);
			});
		});

		describe('ONGOING', () => {
			it('should init with correct payoutTokenAddress, payoutVolume, bountyType, hasFundingGoal, fundingToken, and fundingGoal', async () => {
				const actualBountyType = await ongoingContract.bountyType();
				const actualBountyPayoutVolume = await ongoingContract.payoutVolume();
				const actualBountyPayoutTokenAddress = await ongoingContract.payoutTokenAddress();

				const actualBountyHasFundingGoal = await ongoingContract.hasFundingGoal();
				const actualBountyFundingGoalAddress = await ongoingContract.fundingToken();
				const actualBountyFundingGoal = await ongoingContract.fundingGoal();

				await expect(actualBountyType).equals(1);
				await expect(actualBountyPayoutVolume).equals(100);
				await expect(actualBountyPayoutTokenAddress).equals(mockLink.address);
				await expect(actualBountyHasFundingGoal).equals(true);
				await expect(actualBountyFundingGoalAddress).equals(mockLink.address);
				await expect(actualBountyFundingGoal).equals(100);
			});
		});

		describe('TIERED', () => {
			it('should init with tiered and payout schedule, hasFundingGoal, fundingToken, fundingGoal', async () => {
				const actualBountyType = await tieredContract.bountyType();
				const actualBountyPayoutSchedule = await tieredContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

				const actualBountyHasFundingGoal = await tieredContract.hasFundingGoal();
				const actualBountyFundingGoalAddress = await tieredContract.fundingToken();
				const actualBountyFundingGoal = await tieredContract.fundingGoal();

				await expect(actualBountyType).equals(2);
				await expect(payoutToString[0]).equals("80");
				await expect(payoutToString[1]).equals("20");

				await expect(actualBountyHasFundingGoal).equals(true);
				await expect(actualBountyFundingGoalAddress).equals(mockLink.address);
				await expect(actualBountyFundingGoal).equals(100);
			});

			it('should revert if payoutSchedule values do not add up to 100', async () => {
				// ARRANGE
				tieredContract = await BountyV1.deploy();
				await tieredContract.deployed();

				const abiEncodedParamsTieredBountyNot100 = abiCoder.encode(["uint256[]", "bool", "address", "uint256"], [[1, 2], true, mockLink.address, 100]);

				tieredBountyInitOperation = [2, abiEncodedParamsTieredBountyNot100];

				// ACT/ASSERT
				await expect(tieredContract.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, tieredBountyInitOperation)).to.be.revertedWith('Payout schedule must add up to 100');
			});
		});

		describe('TIERED FIXED', () => {
			it('should init with tiered and payout schedule, payoutTokenAddress', async () => {
				const actualBountyType = await tieredFixedContract.bountyType();
				const actualBountyPayoutSchedule = await tieredFixedContract.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

				const actualBountyPayoutTokenAddress = await tieredFixedContract.payoutTokenAddress();

				await expect(actualBountyType).equals(3);
				await expect(payoutToString[0]).equals("100");
				await expect(payoutToString[1]).equals("50");

				await expect(actualBountyPayoutTokenAddress).equals(mockLink.address);
			});
		});
	});

	describe('receiveFunds', () => {
		describe('ALL', () => {
			it('should revert if not called by Deposit Manager contract', async () => {
				// ARRANGE
				const [, , , , notDepositManager] = await ethers.getSigners();
				const volume = 10000;
				let bountyWithNonDepositManagerAccount = atomicContract.connect(notDepositManager);

				// ASSERT
				await expect(bountyWithNonDepositManagerAccount.receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('DepositManagerOwnable: caller is not the current OpenQ Deposit Manager');
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

				await atomicContract.close(owner.address, []);
				await tieredContract.closeCompetition(owner.address);
				await ongoingContract.closeOngoing(owner.address);

				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
				await expect(ongoingContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
				await expect(tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
			});

			describe('DEPOSIT INITIALIZATION', () => {
				it(`should initialize token deposit data with correct: funder, tokenAddress, volume, depositTime, expiration, isNft`, async () => {
					// ARRANGE
					const depositId = generateDepositId(mockId, 0);
					const expectedTimestamp = await setNextBlockTimestamp();
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);

					// ASSERT
					expect(await atomicContract.funder(depositId)).to.equal(owner.address);
					expect(await atomicContract.tokenAddress(depositId)).to.equal(mockLink.address);
					expect(await atomicContract.volume(depositId)).to.equal(100);
					expect(await atomicContract.expiration(depositId)).to.equal(thirtyDays);
					expect(await atomicContract.isNFT(depositId)).to.equal(false);

					const depositTime = await atomicContract.depositTime(depositId);
					expect(depositTime.toString()).to.equal(expectedTimestamp.toString());
				});
			});

			describe('transferFrom - ERC20', () => {
				it('should transfer volume of ERC20 from sender to bounty (zero transfer fee ERC20)', async () => {
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

			describe('trasfer - protocol token', () => {
				it('should accept msg.value if token address is zero address', async () => {
					const volume = ethers.utils.parseEther("1.0");
					await atomicContract.connect(depositManager).receiveFunds(owner.address, ethers.constants.AddressZero, volume, thirtyDays, { value: volume });
					const bountyProtocolTokenBalance = await atomicContract.provider.getBalance(atomicContract.address);
					expect(bountyProtocolTokenBalance).to.equal(volume);
				});
			});

			describe('globally unique deposit ids', () => {
				it('should create a globally unique deposit id across all bounties', async () => {
					await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
					const deposits = await atomicContract.getDeposits();
					const depositId = deposits[0];

					const newBounty = await BountyV1.deploy();
					await newBounty.deployed();
					await newBounty.initialize('other-mock-id', owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyInitOperation);

					await mockLink.approve(newBounty.address, 20000);
					await newBounty.connect(depositManager).receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
					const newDeposits = await newBounty.getDeposits();
					const newDepositId = newDeposits[0];

					expect(newDepositId).to.not.equal(depositId);
				});
			});
		});
	});

	describe('receiveNFT', () => {
		describe('deposit initialization', () => {
			it(`should initialize nft deposit data with correct: funder, tokenAddress, tokenId, depositTime, expiration, isNft, tier`, async () => {

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

		describe('require and reverts', () => {
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
			await expect(atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
		});
	});

	describe('refundDeposit', () => {
		describe('require and revert', () => {
			it('should revert if not called by Deposit Manager contract', async () => {
				// ARRANGE
				const [, , , , , notDepositManager] = await ethers.getSigners();
				let issueWithNonOwnerAccount = atomicContract.connect(notDepositManager);

				const mockDepositId = generateDepositId(owner.address, mockLink.address, 123);

				// ASSERT
				await expect(issueWithNonOwnerAccount.refundDeposit(mockDepositId, owner.address)).to.be.revertedWith('DepositManagerOwnable: caller is not the current OpenQ Deposit Manager');
			});

			it('should revert if called before expiration', async () => {
				// ARRANGE
				const volume = 100;

				// ASSUME
				const linkDepositId = generateDepositId(mockId, 0);
				await atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, 10000);

				// ACT
				await expect(atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
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
				await atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address);
				await atomicContract.connect(depositManager).refundDeposit(daiDepositId, owner.address);
				await atomicContract.connect(depositManager).refundDeposit(protocolDepositId, owner.address);

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
				await atomicContract.connect(depositManager).refundDeposit(linkDepositId, owner.address);
				await atomicContract.connect(depositManager).refundDeposit(daiDepositId, owner.address);

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
				await atomicContract.connect(depositManager).refundDeposit(depositId, owner.address);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
			});
		});
	});

	describe('claimBalance', () => {
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
		});

		describe('TIERED', () => {
			it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await tieredContract.getDeposits();
				const linkDepositId = deposits[0];

				await tieredContract.closeCompetition(owner.address);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredContract.address)).toString();
				expect(bountyMockTokenBalance).to.equal('1000');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ACT
				await tieredContract.connect(claimManager).claimTiered(firstPlace.address, 0, mockLink.address);

				// // ASSERT
				const newClaimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('800');

				// ACT
				await tieredContract.connect(claimManager).claimTiered(secondPlace.address, 1, mockLink.address);

				// // ASSERT
				const secondPlaceMockTokenBalance = (await mockLink.balanceOf(secondPlace.address)).toString();
				expect(secondPlaceMockTokenBalance).to.equal('200');
			});

			it('should revert if competition is not closed', async () => {
				// ACT/ASSERT
				await expect(tieredContract.connect(claimManager).claimTiered(owner.address, 0, mockLink.address)).to.be.revertedWith('COMPETITION_NOT_CLOSED');
			});

			it('should revert if competition is not TIERED', async () => {
				// ACT/ASSERT
				tieredFixedContract.closeCompetition(owner.address);
				await expect(tieredFixedContract.connect(claimManager).claimTiered(owner.address, 0, mockLink.address)).to.be.revertedWith('NOT_A_TIERED_BOUNTY');
			});
		});

		describe('TIERED FIXED', () => {
			it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
				// ARRANGE
				const volume = 150;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredFixedContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await tieredFixedContract.getDeposits();
				const linkDepositId = deposits[0];

				await tieredFixedContract.closeCompetition(owner.address);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredFixedContract.address)).toString();
				expect(bountyMockTokenBalance).to.equal('150');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

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

			it('should revert if competition is not closed', async () => {
				// ACT/ASSERT
				await expect(tieredFixedContract.connect(claimManager).claimTieredFixed(owner.address, 0)).to.be.revertedWith('COMPETITION_NOT_CLOSED');
			});

			it('should revert if competition is not TIERED FIXED', async () => {
				// ACT/ASSERT
				tieredContract.closeCompetition(owner.address);
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

	describe('closeBounty', () => {
		describe('SINGLE', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				let issueWithNonOwnerAccount = atomicContract.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.close(owner.address, closerData)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if already closed', async () => {
				// ARRANGE
				atomicContract.close(owner.address, closerData);
				//ACT / ASSERT
				await expect(atomicContract.close(owner.address, closerData)).to.be.revertedWith('CLOSING_CLOSED_BOUNTY');
			});

			it('should change status to CLOSED (1)', async () => {
				// ASSUME
				await expect(await atomicContract.status()).equals(0);
				//ACT
				await atomicContract.close(owner.address, closerData);
				// ASSERT
				await expect(await atomicContract.status()).equals(1);
			});

			it('should set closer to payout address', async () => {
				// ASSUME
				await expect(await atomicContract.closer()).equals(ethers.constants.AddressZero);
				//ACT
				await atomicContract.close(owner.address, closerData);
				// ASSERT
				await expect(await atomicContract.closer()).equals(owner.address);
			});

			it('should set bountyClosedTime to the block timestamp', async () => {
				// ARRANGE
				const expectedTimestamp = await setNextBlockTimestamp();
				// ASSUME
				await expect(await atomicContract.bountyClosedTime()).equals(0);
				//ACT
				await atomicContract.close(owner.address, closerData);
				// ASSERT
				await expect(await atomicContract.bountyClosedTime()).equals(expectedTimestamp);
			});
		});

		describe('TIERED - closeCompetition', () => {
			it('should set bounty status to 1, freeze balances and set bountyClosedTime', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await atomicContract.getDeposits();
				const linkDepositId = deposits[0];

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
				await tieredContract.closeCompetition(owner.address);

				status = await tieredContract.status();
				mockTokenFundingTotal = await tieredContract.fundingTotals(mockLink.address);
				bountyClosedTime = await tieredContract.bountyClosedTime();

				expect(status).to.equal(1);
				expect(mockTokenFundingTotal).to.equal(1000);
				expect(bountyClosedTime).to.equal(expectedTimestamp);
			});

			it('should revert if caller is not issuer', async () => {
				const [, notOwner] = await ethers.getSigners();
				await expect(tieredContract.closeCompetition(notOwner.address)).to.be.revertedWith('COMPETITION_CLOSER_NOT_ISSUER');
			});

			it('should revert if already closed', async () => {
				await tieredContract.closeCompetition(owner.address);
				await expect(tieredContract.closeCompetition(owner.address)).to.be.revertedWith('COMPETITION_ALREADY_CLOSED');
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
				await expect(ongoingContract.closeOngoing(notOwner.address)).to.be.revertedWith('BOUNTY_CLOSER_NOT_ISSUER');
			});

			it('should revert if already closed', async () => {
				await ongoingContract.closeOngoing(owner.address);
				await expect(ongoingContract.closeOngoing(owner.address)).to.be.revertedWith('ONGOING_BOUNTY_ALREADY_CLOSED');
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