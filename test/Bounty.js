/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');

describe('Bounty.sol', () => {
	let bounty;
	let mockLink;
	let mockDai;
	let owner;

	beforeEach(async () => {
		const Bounty = await hre.ethers.getContractFactory('BountyV0');
		const MockLink = await hre.ethers.getContractFactory('MockLink');
		const MockDai = await hre.ethers.getContractFactory('MockDai');

		[owner] = await ethers.getSigners();

		bounty = await Bounty.deploy("mockId", owner.address, "mock-org");
		await bounty.deployed();

		mockLink = await MockLink.deploy();
		await mockLink.deployed();
		mockDai = await MockDai.deploy();
		await mockDai.deployed();

		await mockLink.approve(bounty.address, 10000000);
		await mockDai.approve(bounty.address, 10000000);
	});

	describe('receiveFunds', () => {

		describe('require and revert', () => {
			it('should revert if not called by owner', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();

				const value = 10000;

				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.receiveFunds(notOwner.address, mockLink.address, value)).to.be.revertedWith('Ownable: caller is not the owner');
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
				await expect(bounty.receiveFunds(owner.address, mockLink.address, greaterThanAllowance)).to.be.revertedWith('TransferHelper::transferFrom: transferFrom failed');
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

		describe('funderTokenAddresses', () => {
			it('should add that token address to fundersTokenAddresses if its a new address', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroLength = await bounty.getFunderTokenAddresses(owner.address);
				expect(zeroLength.length).to.equal(0);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const fundersTokenAddress = await bounty.getFunderTokenAddresses(owner.address);
				expect(fundersTokenAddress[0]).to.equal(mockLink.address);
			});

			it('should NOT add that token address to fundersTokenAddresses if its NOT a new address', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroLength = await bounty.getFunderTokenAddresses(owner.address);
				expect(zeroLength.length).to.equal(0);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const fundersTokenAddress = await bounty.getFunderTokenAddresses(owner.address);
				expect(fundersTokenAddress[0]).to.equal(mockLink.address);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const fundersTokenNewAddress = await bounty.getFunderTokenAddresses(owner.address);
				expect(fundersTokenNewAddress.length).to.equal(1);
			});
		});

		describe('fundersDeposits', () => {
			it('should increment fundersDeposits at tokenAddress by value', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroValue = (await bounty.funderDeposits(owner.address, mockLink.address)).toNumber();
				expect(zeroValue).to.equal(0);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const funderDepositsForTokenAddress = (await bounty.funderDeposits(owner.address, mockLink.address)).toNumber();
				expect(funderDepositsForTokenAddress).to.equal(value);

				// ACT
				await bounty.receiveFunds(owner.address, mockLink.address, value);

				// ASSERT
				const funderNewDeposits = (await bounty.funderDeposits(owner.address, mockLink.address)).toNumber();
				expect(funderNewDeposits).to.equal(value + value);

				// ACT
				await bounty.receiveFunds(owner.address, mockDai.address, value);

				// ASSERT
				const funderNewDepositsOnOtherAddress = (await bounty.funderDeposits(owner.address, mockDai.address)).toNumber();
				expect(funderNewDepositsOnOtherAddress).to.equal(value);

				// ACT
				await bounty.receiveFunds(owner.address, mockDai.address, value);

				// ASSERT
				const funderNewDepositsOnOtherAddressNewer = (await bounty.funderDeposits(owner.address, mockDai.address)).toNumber();
				expect(funderNewDepositsOnOtherAddressNewer).to.equal(value + value);
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

	describe('claimBounty', () => {
		describe('require and revert', () => {
			it('should revert if not called by owner', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				const value = 10000;
				let issueWithNonOwnerAccount = bounty.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.claim(notOwner.address, mockLink.address)).to.be.revertedWith('Ownable: caller is not the owner');
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
			it('should revert if not called by owner', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();
				let issueWithNonOwnerAccount = bounty.connect(notOwner);
				// ASSERT
				await expect(issueWithNonOwnerAccount.refundBountyDeposit(notOwner.address, mockLink.address)).to.be.revertedWith('Ownable: caller is not the owner');
			});
		});

		describe('fundersDeposits', () => {
			it('should decrement fundersDeposits at tokenAddress by value refunded', async () => {
				// ARRANGE
				const value = 100;

				await bounty.receiveFunds(owner.address, mockLink.address, value);
				await bounty.receiveFunds(owner.address, mockDai.address, value);

				// ASSUME
				const funderMockTokenDeposit = (await bounty.funderDeposits(owner.address, mockLink.address)).toNumber();
				expect(funderMockTokenDeposit).to.equal(value);
				const funderFakeTokenDeposit = (await bounty.funderDeposits(owner.address, mockDai.address)).toNumber();
				expect(funderFakeTokenDeposit).to.equal(value);

				// ACT
				await bounty.refundBountyDeposit(owner.address, mockLink.address);
				await bounty.refundBountyDeposit(owner.address, mockDai.address);

				// ASSERT
				const decrementedFunderMockTokenDeposit = (await bounty.funderDeposits(owner.address, mockLink.address)).toNumber();
				expect(decrementedFunderMockTokenDeposit).to.equal(0);
				const decrementedFunderFakeTokenDeposit = (await bounty.funderDeposits(owner.address, mockDai.address)).toNumber();
				expect(decrementedFunderFakeTokenDeposit).to.equal(0);
			});
		});

		describe('transfer', () => {
			it('should transfer refunded asset from bounty contract to funder', async () => {
				// ARRANGE
				const value = 100;
				await bounty.receiveFunds(owner.address, mockLink.address, value);
				await bounty.receiveFunds(owner.address, mockDai.address, value);

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
				await bounty.refundBountyDeposit(owner.address, mockLink.address);
				await bounty.refundBountyDeposit(owner.address, mockDai.address);

				// // ASSERT
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