/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { generateDepositId, generateClaimantId } = require('./utils');

describe('BountyV1.sol', () => {
	let BountyV1;
	let mockLink;
	let mockDai;
	let owner;
	let initializationTimestamp;
	const thirtyDays = 2765000;

	const mockId = "mockId";
	const organization = "mockOrg";

	// Initialization Operations
	let bountyInitOperation;
	let tieredBountyInitOperation;
	let ongoingBountyInitOperation;
	let fundingGoalInitOperation;

	// Test bounties
	let bounty;
	let ongoingBounty;
	let tieredBounty;
	let fundingGoalBounty;

	let abiCoder = new ethers.utils.AbiCoder;
	let abiEncodedCloserUrl = abiCoder.encode(["string"], ["https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);
	let ongoingCloserData = abiCoder.encode(["string", "string"], ["FlacoJones", "https://github.com/OpenQDev/OpenQ-Frontend/pull/398"]);

	beforeEach(async () => {
		BountyV1 = await ethers.getContractFactory('BountyV1');
		const MockLink = await ethers.getContractFactory('MockLink');
		const MockDai = await ethers.getContractFactory('MockDai');
		const MockNft = await ethers.getContractFactory('MockNft');

		[owner] = await ethers.getSigners();

		// Mint a single contributor bounty
		bounty = await BountyV1.deploy();
		await bounty.deployed();

		bountyInitOperation = [0, []];

		// Passing in owner.address as _openQ for unit testing since most methods are onlyOpenQ protected
		initializationTimestamp = await setNextBlockTimestamp();
		await bounty.initialize(mockId, owner.address, organization, owner.address, bountyInitOperation);

		// Deploy mock assets
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

		await mockNft.approve(bounty.address, 0);
		await mockNft.approve(bounty.address, 1);
		await mockNft.approve(bounty.address, 2);
		await mockNft.approve(bounty.address, 3);
		await mockNft.approve(bounty.address, 4);
		await mockNft.approve(bounty.address, 5);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(bounty.address, 10000000);
		await mockDai.approve(bounty.address, 10000000);

		// Mint an Ongoing Bounty
		ongoingBounty = await BountyV1.deploy();
		await ongoingBounty.deployed();

		const abiEncodedParams = abiCoder.encode(["address", "uint256"], [mockLink.address, '100']);

		ongoingBountyInitOperation = [1, abiEncodedParams];

		await ongoingBounty.initialize(mockId, owner.address, organization, owner.address, ongoingBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(ongoingBounty.address, 10000000);
		await mockDai.approve(ongoingBounty.address, 10000000);

		// Mint a Tiered Bounty
		tieredBounty = await BountyV1.deploy();
		await tieredBounty.deployed();

		const abiEncodedParamsTieredBounty = abiCoder.encode(["uint256[]"], [[80, 20]]);

		tieredBountyInitOperation = [2, abiEncodedParamsTieredBounty];

		await tieredBounty.initialize(mockId, owner.address, organization, owner.address, tieredBountyInitOperation);

		// Pre-approve LINK and DAI for transfers during testing
		await mockLink.approve(tieredBounty.address, 10000000);
		await mockDai.approve(tieredBounty.address, 10000000);

		// Mint a Funding Goal Bounty
		fundingGoalBounty = await BountyV1.deploy();
		await fundingGoalBounty.deployed();

		const abiEncodedParamsFundingGoalBounty = abiCoder.encode(["address", "uint256"], [mockLink.address, 100]);

		fundingGoalInitOperation = [3, abiEncodedParamsFundingGoalBounty];

		await fundingGoalBounty.initialize(mockId, owner.address, organization, owner.address, fundingGoalInitOperation);
	});

	describe('initializer', () => {
		describe('ATOMIC', () => {
			it(`should initialize bounty with correct: bountyId, issuer, organization, status, openQImplementation, bountyCreatedTime, and class`, async () => {
				// ARRANGE
				const actualBountyId = await bounty.bountyId();
				const actualIssuer = await bounty.issuer();
				const actualOrganization = await bounty.organization();
				const actualStatus = await bounty.status();
				const actualOpenQ = await bounty.openQ();
				const actualBounyCreatedTime = await bounty.bountyCreatedTime();
				const actualBounyClass = await bounty.class();

				// ASSERT
				await expect(actualBountyId).equals(mockId);
				await expect(actualIssuer).equals(owner.address);
				await expect(organization).equals(organization);
				await expect(actualStatus).equals(0);
				await expect(actualOpenQ).equals(owner.address);
				await expect(actualBounyCreatedTime).equals(initializationTimestamp);
				await expect(actualBounyClass).equals(0);
			});

			it('should revert if bountyId is empty', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				bounty = await BountyV1.deploy();

				// ASSERT
				await expect(bounty.initialize("", owner.address, organization, owner.address, bountyInitOperation)).to.be.revertedWith('NO_EMPTY_BOUNTY_ID');
			});

			it('should revert if organization is empty', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				bounty = await BountyV1.deploy();

				// ASSERT
				await expect(bounty.initialize(mockId, owner.address, "", owner.address, bountyInitOperation)).to.be.revertedWith('NO_EMPTY_ORGANIZATION');
			});

			it('should revert if given an invalid operaion', async () => {
				// ARRANGE
				const BountyV1 = await ethers.getContractFactory('BountyV1');
				bounty = await BountyV1.deploy();

				// ASSERT
				await expect(bounty.initialize(mockId, owner.address, organization, owner.address, [42, []])).to.be.revertedWith('OQ: unknown init operation type');
			});
		});

		describe('ONGOING', () => {
			it('should init with correct payoutTokenAddress, payoutVolume, and class', async () => {
				const actualBountyClass = await ongoingBounty.class();
				const actualBountyPayoutVolume = await ongoingBounty.payoutVolume();
				const actualBountyPayoutTokenAddress = await ongoingBounty.payoutTokenAddress();

				await expect(actualBountyClass).equals(1);
				await expect(actualBountyPayoutVolume).equals(100);
				await expect(actualBountyPayoutTokenAddress).equals(mockLink.address);
			});
		});

		describe('TIERED', () => {
			it('should init with tiered and payout schedule', async () => {
				const actualBountyClass = await tieredBounty.class();
				const actualBountyPayoutSchedule = await tieredBounty.getPayoutSchedule();
				const payoutToString = actualBountyPayoutSchedule.map(thing => thing.toString());

				await expect(actualBountyClass).equals(2);
				await expect(payoutToString[0]).equals("80");
				await expect(payoutToString[1]).equals("20");
			});

			it('should revert if payoutSchedule values do not add up to 100', async () => {
				// ARRANGE
				tieredBounty = await BountyV1.deploy();
				await tieredBounty.deployed();

				const abiEncodedParamsTieredBountyNot100 = abiCoder.encode(["uint256[]"], [[1, 2]]);

				tieredBountyInitOperation = [2, abiEncodedParamsTieredBountyNot100];

				// ACT/ASSERT
				await expect(tieredBounty.initialize(mockId, owner.address, organization, owner.address, tieredBountyInitOperation)).to.be.revertedWith('Payout schedule must add up to 100');
			});
		});

		describe('FUNDING GOAL', () => {
			it('should init with correct payoutTokenAddress, payoutVolume, and class', async () => {
				const actualBountyClass = await fundingGoalBounty.class();
				const actualBountyFundingGoal = await fundingGoalBounty.fundingGoal();
				const actualBountyFundingTokenAddress = await fundingGoalBounty.fundingToken();

				await expect(actualBountyClass).equals(3);
				await expect(actualBountyFundingGoal).equals(100);
				await expect(actualBountyFundingTokenAddress).equals(mockLink.address);
			});
		});
	});

	describe('receiveFunds', () => {
		describe('ALL', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const volume = 10000;
				let bountyWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(bountyWithNonOwnerAccount.receiveFunds(notOwner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if no volume is sent', async () => {
				// ASSERT
				await expect(bounty.receiveFunds(owner.address, mockLink.address, 0, thirtyDays)).to.be.revertedWith('ZERO_VOLUME_SENT');
			});

			it('should revert if funder tries to send more than allowance', async () => {
				const greaterThanAllowance = 100000000;
				await expect(bounty.receiveFunds(owner.address, mockLink.address, greaterThanAllowance, thirtyDays)).to.be.revertedWith('ERC20: insufficient allowance');
			});

			it('should revert if expiration is negative', async () => {
				await expect(bounty.receiveFunds(owner.address, mockLink.address, 100, 0)).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});

			it('should revert if bounty is closed', async () => {
				// ARRANGE
				const volume = 1000;

				await bounty.close(owner.address, []);
				await tieredBounty.closeCompetition(owner.address);
				await ongoingBounty.closeOngoing(owner.address);

				await expect(bounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
				await expect(ongoingBounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
				await expect(tieredBounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('BOUNTY_IS_CLOSED');
			});

			describe('DEPOSIT INITIALIZATION', () => {
				it(`should initialize token deposit data with correct: funder, tokenAddress, volume, depositTime, expiration, isNft`, async () => {
					// ARRANGE
					const depositId = generateDepositId(mockId, 0);
					const expectedTimestamp = await setNextBlockTimestamp();
					await bounty.receiveFunds(owner.address, mockLink.address, 100, thirtyDays);

					// ASSERT
					expect(await bounty.funder(depositId)).to.equal(owner.address);
					expect(await bounty.tokenAddress(depositId)).to.equal(mockLink.address);
					expect(await bounty.volume(depositId)).to.equal(100);
					expect(await bounty.expiration(depositId)).to.equal(thirtyDays);
					expect(await bounty.isNFT(depositId)).to.equal(false);

					const depositTime = await bounty.depositTime(depositId);
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

					const initialIssueMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
					const initialIssueMockDaiBalance = (await mockDai.balanceOf(bounty.address)).toString();
					expect(initialIssueMockLinkBalance).to.equal('0');
					expect(initialIssueMockDaiBalance).to.equal('0');

					// ARRANGE
					const value = 100;

					// ACT
					await bounty.receiveFunds(owner.address, mockLink.address, value, thirtyDays);
					await bounty.receiveFunds(owner.address, mockDai.address, value, thirtyDays);

					// ASSERT
					const funderMockLinkBalance = (await mockDai.balanceOf(owner.address)).toString();
					const funderFakeTokenBalance = (await mockLink.balanceOf(owner.address)).toString();
					expect(funderMockLinkBalance).to.equal('9999999999999999999900');
					expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

					const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
					const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
					expect(bountyMockTokenBalance).to.equal('100');
					expect(bountyFakeTokenBalance).to.equal('100');
				});
			});

			describe('trasfer - protocol token', () => {
				it('should accept msg.value if token address is zero address', async () => {
					const volume = ethers.utils.parseEther("1.0");
					await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, thirtyDays, { value: volume });
					const bountyProtocolTokenBalance = await bounty.provider.getBalance(bounty.address);
					expect(bountyProtocolTokenBalance).to.equal(volume);
				});
			});

			describe('globally unique deposit ids', () => {
				it('should create a globally unique deposit id across all bounties', async () => {
					await bounty.receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
					const deposits = await bounty.getDeposits();
					const depositId = deposits[0];

					const newBounty = await BountyV1.deploy();
					await newBounty.deployed();
					await newBounty.initialize('other-mock-id', owner.address, organization, owner.address, bountyInitOperation);

					await mockLink.approve(newBounty.address, 20000);
					await newBounty.receiveFunds(owner.address, mockLink.address, 100, thirtyDays);
					const newDeposits = await newBounty.getDeposits();
					const newDepositId = newDeposits[0];

					expect(newDepositId).to.not.equal(depositId);
				});
			});
		});
	});

	describe('receiveNFT', () => {
		describe('deposit initialization', () => {
			it(`should initialize nft deposit data with correct: funder, tokenAddress, tokenId, depositTime, expiration, isNft
			`, async () => {

				// ACT
				const expectedTimestamp = await setNextBlockTimestamp();
				const depositId = generateDepositId(mockId, 0);
				await bounty.receiveNft(owner.address, mockNft.address, 1, thirtyDays);

				// ASSERT
				expect(await bounty.funder(depositId)).to.equal(owner.address);
				expect(await bounty.tokenAddress(depositId)).to.equal(mockNft.address);
				expect(await bounty.tokenId(depositId)).to.equal(1);
				expect(await bounty.expiration(depositId)).to.equal(thirtyDays);
				expect(await bounty.isNFT(depositId)).to.equal(true);

				const depositTime = await bounty.depositTime(depositId);
				expect(depositTime.toString()).to.equal(expectedTimestamp.toString());
			});
		});

		describe('transfer', () => {
			it('should transfer NFT from owner to bounty contract', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(0)).to.equal(owner.address);

				// ACT
				await bounty.receiveNft(owner.address, mockNft.address, 0, 1);

				// ASSERT
				expect(await mockNft.ownerOf(0)).to.equal(bounty.address);
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
				await bounty.receiveNft(owner.address, mockNft.address, 0, 1);
				await bounty.receiveNft(owner.address, mockNft.address, 1, 1);
				await bounty.receiveNft(owner.address, mockNft.address, 2, 1);
				await bounty.receiveNft(owner.address, mockNft.address, 3, 1);
				await bounty.receiveNft(owner.address, mockNft.address, 4, 1);

				// ASSERT
				await expect(bounty.receiveNft(owner.address, mockNft.address, 5, 1)).to.be.revertedWith('NFT_DEPOSIT_LIMIT_REACHED');
			});

			it('should revert if expiration is negative', async () => {
				await expect(bounty.receiveNft(owner.address, mockNft.address, 0, 0)).to.be.revertedWith('EXPIRATION_NOT_GREATER_THAN_ZERO');
			});
		});
	});

	describe('extendDeposit', () => {
		it('should extend deposit expiration by _seconds', async () => {
			// ARRANGE
			const volume = 100;

			// ASSUME
			const linkDepositId = generateDepositId(mockId, 0);
			await bounty.receiveFunds(owner.address, mockLink.address, volume, 1);

			// ACT
			await bounty.extendDeposit(linkDepositId, 1000, owner.address);

			// ASSERT
			// This will fail to revert without a deposit extension. Cannot test the counter case due to the inability to call refund twice, see DEPOSIT_ALREADY_REFUNDED
			await expect(bounty.refundDeposit(linkDepositId, owner.address)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
		});
	});

	describe('refundDeposit', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				const mockDepositId = generateDepositId(owner.address, mockLink.address, 123);

				// ASSERT
				await expect(issueWithNonOwnerAccount.refundDeposit(mockDepositId, owner.address)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if called before expiration', async () => {
				// ARRANGE
				const volume = 100;

				// ASSUME
				const linkDepositId = generateDepositId(mockId, 0);
				await bounty.receiveFunds(owner.address, mockLink.address, volume, 10000);

				// ACT
				await expect(bounty.refundDeposit(linkDepositId, owner.address)).to.be.revertedWith('PREMATURE_REFUND_REQUEST');
			});
		});

		describe('refunded', () => {
			it('should set deposit refunded to true on refund', async () => {
				// ARRANGE
				const volume = 100;

				// ASSUME
				const linkDepositId = generateDepositId(mockId, 0);
				await bounty.receiveFunds(owner.address, mockLink.address, volume, 1);
				expect(await bounty.refunded(linkDepositId)).to.equal(false);

				const daiDepositId = generateDepositId(mockId, 1);
				await bounty.receiveFunds(owner.address, mockDai.address, volume, 1);
				expect(await bounty.refunded(daiDepositId)).to.equal(false);

				const protocolDepositId = generateDepositId(mockId, 2);
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });
				expect(await bounty.refunded(protocolDepositId)).to.equal(false);

				// ACT
				await bounty.refundDeposit(linkDepositId, owner.address);
				await bounty.refundDeposit(daiDepositId, owner.address);
				await bounty.refundDeposit(protocolDepositId, owner.address);

				// ASSERT
				expect(await bounty.refunded(linkDepositId)).to.equal(true);
				expect(await bounty.refunded(daiDepositId)).to.equal(true);
				expect(await bounty.refunded(protocolDepositId)).to.equal(true);
			});
		});

		describe('transfer', () => {
			it('should transfer refunded ERC20 and protocol token asset from bounty contract to funder', async () => {
				// ARRANGE
				const volume = 100;

				const linkDepositId = generateDepositId(mockId, 0);
				await bounty.receiveFunds(owner.address, mockLink.address, volume, 1);

				const daiDepositId = generateDepositId(mockId, 1);
				await bounty.receiveFunds(owner.address, mockDai.address, volume, 1);

				const protocolDepositId = generateDepositId(mockId, 2);
				await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, 1, { value: volume });

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				const bountyProtocolTokenBalance = (await ethers.provider.getBalance(bounty.address)).toString();

				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');
				expect(bountyProtocolTokenBalance).to.equal('100');

				const funderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(funderMockLinkBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				// // // ACT
				await bounty.refundDeposit(linkDepositId, owner.address);
				await bounty.refundDeposit(daiDepositId, owner.address);

				// // // // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
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
				await bounty.receiveNft(owner.address, mockNft.address, 1, 1);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(bounty.address);

				// ACT
				await bounty.refundDeposit(depositId, owner.address);

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
			const initialClaimerProtocolBalance = (await bounty.provider.getBalance(claimer.address));

			await bounty.receiveFunds(owner.address, ethers.constants.AddressZero, volume, thirtyDays, { value: volume });

			const deposits = await bounty.getDeposits();
			const protocolDepositId = deposits[0];

			// ASSUME
			const bountyProtocolTokenBalance = (await bounty.provider.getBalance(bounty.address)).toString();
			expect(bountyProtocolTokenBalance).to.equal('100');

			const claimerProtocolBalance = (await ethers.provider.getBalance(claimer.address));

			// ACT
			await bounty.claimBalance(claimer.address, ethers.constants.AddressZero);

			// ASSERT
			const newBountyProtocolTokenBalance = (await bounty.provider.getBalance(bounty.address)).toString();
			const tokenBalance = (await bounty.provider.getBalance(bounty.address)).toString();
			expect(newBountyProtocolTokenBalance).to.equal('0');
			expect(tokenBalance).to.equal('0');
		});

		it('should transfer ERC20 token from contract to payout address and set token balance to zero', async () => {
			// ARRANGE
			const volume = 100;

			const [, claimer] = await ethers.getSigners();
			const initialClaimerProtocolBalance = (await bounty.provider.getBalance(claimer.address));

			await bounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays);
			await bounty.receiveFunds(owner.address, mockDai.address, volume, thirtyDays);

			const deposits = await bounty.getDeposits();
			const linkDepositId = deposits[0];
			const daiDepositId = deposits[1];

			// ASSUME
			const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
			const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
			expect(bountyMockTokenBalance).to.equal('100');
			expect(bountyFakeTokenBalance).to.equal('100');

			const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
			const claimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
			expect(claimerMockTokenBalance).to.equal('0');
			expect(claimerFakeTokenBalance).to.equal('0');

			// ACT
			await bounty.claimBalance(claimer.address, mockLink.address);
			await bounty.claimBalance(claimer.address, mockDai.address);

			// ASSERT
			const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
			const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
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

				await ongoingBounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await bounty.getDeposits();
				const linkDepositId = deposits[0];

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(ongoingBounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('300');

				const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ACT
				await ongoingBounty.claimOngoingPayout(claimer.address, ongoingCloserData);

				// ASSERT
				const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('100');

				const newBountyMockLinkBalance = (await mockLink.balanceOf(ongoingBounty.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('200');

				// ACT
				await ongoingBounty.claimOngoingPayout(claimer.address, ongoingCloserData);

				// ASSERT
				const newClaimerMockTokenBalance2 = (await mockLink.balanceOf(claimer.address)).toString();
				expect(newClaimerMockTokenBalance2).to.equal('200');

				const newBountyMockLinkBalance2 = (await mockLink.balanceOf(ongoingBounty.address)).toString();
				expect(newBountyMockLinkBalance2).to.equal('100');
			});

			it('should set claimantId to true for the claimant and claimant asset', async () => {
				// ARRANGE
				let claimantId = generateClaimantId('FlacoJones', "https://github.com/OpenQDev/OpenQ-Frontend/pull/398");
				await ongoingBounty.receiveFunds(owner.address, mockLink.address, 10000000, thirtyDays);


				// ASSUME
				let claimantIdClaimed = await ongoingBounty.claimantId(claimantId);
				expect(claimantIdClaimed).to.equal(false);

				// ACT
				await ongoingBounty.claimOngoingPayout(owner.address, ongoingCloserData);

				// ASSERT
				claimantIdClaimed = await ongoingBounty.claimantId(claimantId);
				expect(claimantIdClaimed).to.equal(true);
			});
		});

		describe('TIERED', () => {
			it('should transfer volume of tokenAddress balance based on payoutSchedule', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredBounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await bounty.getDeposits();
				const linkDepositId = deposits[0];

				await tieredBounty.closeCompetition(owner.address);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredBounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('1000');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ACT
				await tieredBounty.claimTiered(firstPlace.address, 0, mockLink.address);

				// // ASSERT
				const newClaimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('800');

				// ACT
				await tieredBounty.claimTiered(secondPlace.address, 1, mockLink.address);

				// // ASSERT
				const secondPlaceMockTokenBalance = (await mockLink.balanceOf(secondPlace.address)).toString();
				expect(secondPlaceMockTokenBalance).to.equal('200');
			});

			it('should revert if competition is not closed', async () => {
				// ACT/ASSERT
				await expect(tieredBounty.claimTiered(owner.address, 0, mockLink.address)).to.be.revertedWith('COMPETITION_NOT_CLOSED');
			});
		});
	});

	describe('claimNft', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 10000;
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.claimNft(notOwner.address, ethers.utils.formatBytes32String('mockDepositId'))).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if issue is already closed', async () => {
				// ARRANGE
				await bounty.close(owner.address, abiEncodedCloserUrl);

				// ASSERT
				await expect(bounty.claimNft(owner.address, ethers.utils.formatBytes32String('mockDepositId'))).to.be.revertedWith('CLAIMING_CLOSED_BOUNTY');
			});
		});

		describe('transfer', () => {
			it('should transfer NFT deposit from bounty contract to claimer', async () => {
				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);

				// ARRANGE
				const depositId = generateDepositId(mockId, 0);
				await bounty.receiveNft(owner.address, mockNft.address, 1, 1);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(bounty.address);

				// ACT
				await bounty.claimNft(owner.address, depositId);

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
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.close(owner.address, abiEncodedCloserUrl)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if already closed', async () => {
				// ARRANGE
				bounty.close(owner.address, abiEncodedCloserUrl);
				//ACT / ASSERT
				await expect(bounty.close(owner.address, abiEncodedCloserUrl)).to.be.revertedWith('CLOSING_CLOSED_BOUNTY');
			});

			it('should change status to CLOSED (1)', async () => {
				// ASSUME
				await expect(await bounty.status()).equals(0);
				//ACT
				await bounty.close(owner.address, abiEncodedCloserUrl);
				// ASSERT
				await expect(await bounty.status()).equals(1);
			});

			it('should set closer to payout address', async () => {
				// ASSUME
				await expect(await bounty.closer()).equals(ethers.constants.AddressZero);
				//ACT
				await bounty.close(owner.address, abiEncodedCloserUrl);
				// ASSERT
				await expect(await bounty.closer()).equals(owner.address);
			});

			it('should set bountyClosedTime to the block timestamp', async () => {
				// ARRANGE
				const expectedTimestamp = await setNextBlockTimestamp();
				// ASSUME
				await expect(await bounty.bountyClosedTime()).equals(0);
				//ACT
				await bounty.close(owner.address, abiEncodedCloserUrl);
				// ASSERT
				await expect(await bounty.bountyClosedTime()).equals(expectedTimestamp);
			});
		});

		describe('TIERED - closeCompetition', () => {
			it('should set bounty status to 1, freeze balances and set bountyClosedTime', async () => {
				// ARRANGE
				const volume = 1000;

				const [, firstPlace, secondPlace] = await ethers.getSigners();

				await tieredBounty.receiveFunds(owner.address, mockLink.address, volume, thirtyDays);

				const deposits = await bounty.getDeposits();
				const linkDepositId = deposits[0];

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(tieredBounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('1000');

				const claimerMockTokenBalance = (await mockLink.balanceOf(firstPlace.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');

				// ASSUME
				let status = await tieredBounty.status();
				let mockTokenFundingTotal = await tieredBounty.fundingTotals(mockLink.address);
				let bountyClosedTime = await tieredBounty.bountyClosedTime();

				expect(status).to.equal(0);
				expect(mockTokenFundingTotal).to.equal(0);
				expect(bountyClosedTime).to.equal(0);

				const expectedTimestamp = await setNextBlockTimestamp();
				// ACT
				await tieredBounty.closeCompetition(owner.address);

				status = await tieredBounty.status();
				mockTokenFundingTotal = await tieredBounty.fundingTotals(mockLink.address);
				bountyClosedTime = await tieredBounty.bountyClosedTime();

				expect(status).to.equal(2);
				expect(mockTokenFundingTotal).to.equal(1000);
				expect(bountyClosedTime).to.equal(expectedTimestamp);
			});

			it('should revert if caller is not issuer', async () => {
				const [, notOwner] = await ethers.getSigners();
				await expect(tieredBounty.closeCompetition(notOwner.address)).to.be.revertedWith('COMPETITION_CLOSER_NOT_ISSUER');
			});

			it('should revert if already closed', async () => {
				await tieredBounty.closeCompetition(owner.address);
				await expect(tieredBounty.closeCompetition(owner.address)).to.be.revertedWith('COMPETITION_ALREADY_CLOSED');
			});
		});

		describe('ONGOING - closeCompetition', () => {
			it('should set status to 3 and bountyClosedTime', async () => {
				let bountyClosedTime = await ongoingBounty.bountyClosedTime();
				let status = await ongoingBounty.status();

				expect(bountyClosedTime).to.equal(0);
				expect(status).to.equal(0);

				const expectedTimestamp = await setNextBlockTimestamp();
				await ongoingBounty.closeOngoing(owner.address);

				bountyClosedTime = await ongoingBounty.bountyClosedTime();
				status = await ongoingBounty.status();

				expect(bountyClosedTime).to.equal(expectedTimestamp);
				expect(status).to.equal(3);
			});

			it('should revert if caller is not issuer', async () => {
				const [, notOwner] = await ethers.getSigners();
				await expect(ongoingBounty.closeOngoing(notOwner.address)).to.be.revertedWith('BOUNTY_CLOSER_NOT_ISSUER');
			});

			it('should revert if already closed', async () => {
				await ongoingBounty.closeOngoing(owner.address);
				await expect(ongoingBounty.closeOngoing(owner.address)).to.be.revertedWith('ONGOING_BOUNTY_ALREADY_CLOSED');
			});
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