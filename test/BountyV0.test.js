/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');

describe.only('Bounty.sol', () => {
	let bounty;
	let mockLink;
	let mockDai;
	let owner;

	const mockId = "mockId";
	let issuer;
	const organization = "mockOrg";

	beforeEach(async () => {
		const BountyV0 = await hre.ethers.getContractFactory('BountyV0');
		const MockLink = await hre.ethers.getContractFactory('MockLink');
		const MockDai = await hre.ethers.getContractFactory('MockDai');

		[owner] = await ethers.getSigners();
		issuer = owner.address;

		bounty = await BountyV0.deploy();
		await bounty.deployed();
		await bounty.initialize(mockId, owner.address, organization, owner.address);

		mockLink = await MockLink.deploy();
		await mockLink.deployed();
		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		await mockLink.approve(bounty.address, 10000000);
		await mockDai.approve(bounty.address, 10000000);
	});

	describe('constructor', () => {
		it('should initialize by setting the bountyId, issuer and organization and is OPEN correctly', async () => {
			// ARRANGE
			const actualBountyId = await bounty.bountyId();
			const actualIssuer = await bounty.issuer();
			const actualOrganization = await bounty.organization();
			const actualStatus = await bounty.status();

			// ASSERT
			await expect(actualBountyId).equals(mockId);
			await expect(actualIssuer).equals(issuer);
			await expect(organization).equals(organization);
			await expect(actualStatus).equals(0);
		});

		it('should revert if id is empty', async () => {
			// ASSERT
			const BountyV0 = await hre.ethers.getContractFactory('BountyV0');
			bounty = await BountyV0.deploy();

			await expect(bounty.initialize("", owner.address, organization, owner.address)).to.be.revertedWith('id cannot be empty string!');
		});

		it('should revert if organization is empty', async () => {
			// ASSERT
			const BountyV0 = await hre.ethers.getContractFactory('BountyV0');
			bounty = await BountyV0.deploy();

			await expect(bounty.initialize(mockId, owner.address, "", owner.address)).to.be.revertedWith('organization cannot be empty string!');
		});
	});

	describe('receiveFunds', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 10000;
				let bountyWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(bountyWithNonOwnerAccount.receiveFunds(notOwner.address, mockLink.address, value)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if no value is sent', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 0;

				// ASSERT
				await expect(bounty.receiveFunds(owner.address, mockLink.address, value)).to.be.revertedWith('Must send a non-zero volume of tokens.');
			});

			it('should revert if funder tries to send more than allowance', async () => {
				// ARRANGE
				// ACT
				// ASSERT
				const greaterThanAllowance = 100000000;
				await expect(bounty.receiveFunds(owner.address, mockLink.address, greaterThanAllowance)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
			});
		});

		describe('isAFunder', () => {
			it('should set isAFunder to true for the deposit sender', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const isNotAFunder = await bounty.isAFunder(owner.address);
				expect(isNotAFunder).to.be.false;

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const isAFunderNow = await bounty.isAFunder(owner.address);
				expect(isAFunderNow).to.be.true;
			});
		});

		describe('bountyTokenAddresses', () => {
			it('should add that token address to bountyTokenAddresses if current balance is zero for that token', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroLength = await bounty.getBountyTokenAddresses();
				expect(zeroLength.length).to.equal(0);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const newTokenAddress = await bounty.bountyTokenAddresses(0);
				expect(newTokenAddress).to.equal(mockLink.address);
			});

			it('should NOT add that token address to tokenAddresses if it is already there', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroLength = await bounty.getBountyTokenAddresses();
				expect(zeroLength.length).to.equal(0);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const newTokenAddress = await bounty.bountyTokenAddresses(0);
				expect(newTokenAddress).to.equal(mockLink.address);

				const tokenAddresses = await bounty.getBountyTokenAddresses();
				expect(tokenAddresses.length).to.equal(1);
			});
		});

		describe('fundersDeposits', () => {
			it('should add new Deposit for funder in funderDeposits', async () => {
				// ARRANGE
				const volume = 10000;
				const timestamp = await setNextBlockTimestamp();

				// ASSUME
				const depositId = generateDepositId(owner.address, mockLink.address, timestamp);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, volume);

				// ASSERT
				const newDeposit = await bounty.funderDeposits(owner.address, depositId);

				expect(newDeposit.depositId).to.equal(depositId);
				expect(newDeposit.tokenAddress).to.equal(mockLink.address);
				expect(newDeposit.funder).to.equal(owner.address);
				expect(newDeposit.volume).to.equal(10000);
				expect(newDeposit.depositTime).to.equal(timestamp);
			});
		});

		describe('transferFrom', () => {
			it('should transfer the resepctive amount from sender to this bounty address for the token address', async () => {
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
				await bounty.receiveFunds(owner.address, mockLink.address, value);
				await bounty.receiveFunds(owner.address, mockDai.address, value);

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
	});

	describe('closeBounty', () => {
		it('should revert if not called by OpenQ contract', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			let issueWithNonOwnerAccount = bounty.connect(notOwner);

			// ASSERT
			await expect(issueWithNonOwnerAccount.closeBounty(owner.address)).to.be.revertedWith('Method is only callable by OpenQ');
		});

		it('should revert if already closed', async () => {
			// ARRANGE
			bounty.closeBounty(owner.address);
			//ACT / ASSERT
			await expect(bounty.closeBounty(owner.address)).to.be.revertedWith('This is bounty is already closed. Cannot close again.');
		});

		it('should change status to CLOSED (1)', async () => {
			// ASSUME
			await expect(await bounty.status()).equals(0);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.status()).equals(1);
		});

		it('should set closer to payout address', async () => {
			// ASSUME
			await expect(await bounty.closer()).equals(hre.ethers.constants.AddressZero);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.closer()).equals(owner.address);
		});

		it('should set bountyClosedTime to the block timestamp', async () => {
			// ARRANGE
			const expectedTimestamp = await setNextBlockTimestamp();
			// ASSUME
			await expect(await bounty.bountyClosedTime()).equals(0);
			//ACT
			await bounty.closeBounty(owner.address);
			// ASSERT
			await expect(await bounty.bountyClosedTime()).equals(expectedTimestamp);
		});
	});

	describe('claimBounty', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 10000;
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.claim(notOwner.address, mockLink.address)).to.be.revertedWith('Method is only callable by OpenQ');
			});

			it('should revert if issue is already closed', async () => {
				// ARRANGE
				await bounty.closeBounty(owner.address);

				// ASSERT
				await expect(bounty.claim(owner.address, mockLink.address)).to.be.revertedWith('This is bounty is closed. Cannot withdraw again.');
			});
		});

		describe('transfer', () => {
			it('should transfer all assets from bounty contract to claimer', async () => {
				// ARRANGE
				const value = 100;
				await bounty.receiveFunds(owner.address, mockLink.address, value);
				await bounty.receiveFunds(owner.address, mockDai.address, value);
				const [, claimer] = await ethers.getSigners();

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');

				const claimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const claimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				expect(claimerMockTokenBalance).to.equal('0');
				expect(claimerFakeTokenBalance).to.equal('0');

				// // ACT
				await bounty.claim(claimer.address, mockLink.address);
				await bounty.claim(claimer.address, mockDai.address);

				// // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');

				const newClaimerMockTokenBalance = (await mockLink.balanceOf(claimer.address)).toString();
				const newClaimerFakeTokenBalance = (await mockDai.balanceOf(claimer.address)).toString();
				expect(newClaimerMockTokenBalance).to.equal('100');
				expect(newClaimerFakeTokenBalance).to.equal('100');
			});
		});
	});

	describe('refundBountyDeposit', () => {
		describe('require and revert', () => {
			it('should revert if not called by OpenQ contract', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				const mockDepositId = generateDepositId(owner.address, mockLink.address, 123);

				// ASSERT
				await expect(issueWithNonOwnerAccount.refundBountyDeposit(notOwner.address, mockDepositId)).to.be.revertedWith('Method is only callable by OpenQ');
			});
		});

		describe('fundersDeposits', () => {
			it('should set deposit refunded to true on refund', async () => {
				// ARRANGE
				const volume = 100;

				// ACT
				const linkTimestamp = await setNextBlockTimestamp();
				await bounty.receiveFunds(owner.address, mockLink.address, volume);
				const linkDepositId = generateDepositId(owner.address, mockLink.address, linkTimestamp);

				const daiTimestamp = await setNextBlockTimestamp();
				await bounty.receiveFunds(owner.address, mockDai.address, volume);
				const daiDepositId = generateDepositId(owner.address, mockDai.address, daiTimestamp);

				// ASSERT
				const linkDeposit = await bounty.funderDeposits(owner.address, linkDepositId);
				const daiDeposit = await bounty.funderDeposits(owner.address, daiDepositId);

				// ACT
				await bounty.refundBountyDeposit(owner.address, linkDepositId);
				await bounty.refundBountyDeposit(owner.address, daiDepositId);

				// ASSERT
				const refundedLinkDeposit = await bounty.funderDeposits(owner.address, linkDepositId);
				const refundedDaiDeposit = await bounty.funderDeposits(owner.address, daiDepositId);

				expect(refundedLinkDeposit.refunded).to.equal(true);
				expect(refundedDaiDeposit.refunded).to.equal(true);
			});
		});

		describe('transfer', () => {
			it('should transfer refunded asset from bounty contract to funder', async () => {
				// ARRANGE
				const volume = 100;

				const linkTimestamp = await setNextBlockTimestamp();
				await bounty.receiveFunds(owner.address, mockLink.address, volume);
				const linkDepositId = generateDepositId(owner.address, mockLink.address, linkTimestamp);

				const daiTimestamp = await setNextBlockTimestamp();
				await bounty.receiveFunds(owner.address, mockDai.address, volume);
				const daiDepositId = generateDepositId(owner.address, mockDai.address, daiTimestamp);

				// ASSUME
				const bountyMockTokenBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const bountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(bountyMockTokenBalance).to.equal('100');
				expect(bountyFakeTokenBalance).to.equal('100');

				const funderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(funderMockLinkBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				// // ACT
				await bounty.refundBountyDeposit(owner.address, linkDepositId);
				await bounty.refundBountyDeposit(owner.address, daiDepositId);

				// // // ASSERT
				const newBountyMockLinkBalance = (await mockLink.balanceOf(bounty.address)).toString();
				const newBountyFakeTokenBalance = (await mockDai.balanceOf(bounty.address)).toString();
				expect(newBountyMockLinkBalance).to.equal('0');
				expect(newBountyFakeTokenBalance).to.equal('0');

				const newFunderMockLinkBalance = (await mockLink.balanceOf(owner.address)).toString();
				const newFunderFakeTokenBalance = (await mockDai.balanceOf(owner.address)).toString();
				expect(newFunderMockLinkBalance).to.equal('10000000000000000000000');
				expect(newFunderFakeTokenBalance).to.equal('10000000000000000000000');
			});
		});
	});

});

function generateDepositId(address, tokenAddress, timestamp) {
	const abiCoder = new ethers.utils.AbiCoder;
	const abiEncodedParams = abiCoder.encode(['address', 'address', 'uint256'], [address, tokenAddress, timestamp]);
	const depositId = ethers.utils.keccak256(abiEncodedParams);
	return depositId;
}

async function setNextBlockTimestamp() {
	return new Promise(async (resolve,) => {
		const blockNumBefore = await hre.ethers.provider.getBlockNumber();
		const blockBefore = await hre.ethers.provider.getBlock(blockNumBefore);
		const timestampBefore = blockBefore.timestamp;
		const expectedTimestamp = timestampBefore + 10;
		await network.provider.send("evm_setNextBlockTimestamp", [expectedTimestamp]);
		resolve(expectedTimestamp);
	});
}