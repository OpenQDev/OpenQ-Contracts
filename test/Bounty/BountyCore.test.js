/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
require('@nomiclabs/hardhat-waffle');

const { generateDepositId, generateClaimantId } = require('../utils');

describe('BountyCore.sol', () => {
	// CONTRACT FACTORIES
	let AtomicBountyV1;

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

	// INITIALIZATION OPERATIONS
	let atomicBountyInitOperation;

	// TEST CONTRACTS
	let atomicContract;
	let atomicContract_noFundingGoal;

	// MISC
	let initializationTimestampAtomic;
	let initializationTimestampAtomicNoFundingGoal;

	beforeEach(async () => {
		AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
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
		atomicContract = await AtomicBountyV1.deploy();
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
		atomicContract_noFundingGoal = await AtomicBountyV1.deploy();
		await atomicContract_noFundingGoal.deployed();
		let abiEncodedParamsNoFundingGoalBounty = abiCoder.encode(["bool", "address", "uint256", "bool", "bool", "bool", "string", "string", "string"], [false, ethers.constants.AddressZero, 0, true, true, true, mockOpenQId, "", ""]);
		atomicBountyNoFundingGoalInitOperation = [ATOMIC_CONTRACT, abiEncodedParamsNoFundingGoalBounty];
		initializationTimestampAtomicNoFundingGoal = await setNextBlockTimestamp();
		await atomicContract_noFundingGoal.initialize(mockId, owner.address, organization, owner.address, claimManager.address, depositManager.address, atomicBountyNoFundingGoalInitOperation);
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

				await expect(atomicContract.connect(depositManager).receiveFunds(owner.address, mockLink.address, volume, thirtyDays)).to.be.revertedWith('CONTRACT_IS_CLOSED');
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

				const newBounty = await AtomicBountyV1.deploy();
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
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, []);

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
				await atomicContract.connect(depositManager).receiveNft(owner.address, mockNft.address, 1, 1, []);

				// ASSUME
				expect(await mockNft.ownerOf(1)).to.equal(atomicContract.address);

				// ACT
				await atomicContract.connect(claimManager).claimNft(owner.address, depositId);

				// ASSERT
				expect(await mockNft.ownerOf(1)).to.equal(owner.address);
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

	describe('setKycRequired', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(atomicContract.connect(notOwner).setSupportingDocuments(true)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocuments', async () => {
			// ASSUME
			expect(await atomicContract.supportingDocuments()).to.equal(true)
			
			// ACT
			await atomicContract.setSupportingDocuments(false);

			// ASSERT
			expect(await atomicContract.supportingDocuments()).to.equal(false)
		})
	})

	describe('setInvoiceable', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(atomicContract.connect(notOwner).setSupportingDocuments(true)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocuments', async () => {
			// ASSUME
			expect(await atomicContract.supportingDocuments()).to.equal(true)
			
			// ACT
			await atomicContract.setSupportingDocuments(false);

			// ASSERT
			expect(await atomicContract.supportingDocuments()).to.equal(false)
		})
	})

	describe('setSupportingDocuments', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();

			// ASSERT
			await expect(atomicContract.connect(notOwner).setSupportingDocuments(true)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should set supportingDocuments', async () => {
			// ASSUME
			expect(await atomicContract.supportingDocuments()).to.equal(true)
			
			// ACT
			await atomicContract.setSupportingDocuments(false);

			// ASSERT
			expect(await atomicContract.supportingDocuments()).to.equal(false)
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