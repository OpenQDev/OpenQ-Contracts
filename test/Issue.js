/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');

describe('Issue.sol', () => {
	let issue;
	let mockToken;
	let fakeToken;
	let owner;

	beforeEach(async () => {
		const Issue = await hre.ethers.getContractFactory('Issue');
		const MockToken = await hre.ethers.getContractFactory('MockToken');
		const FakeToken = await hre.ethers.getContractFactory('FakeToken');

		[owner] = await ethers.getSigners();

		issue = await Issue.deploy("mockId", owner.address);
		await issue.deployed();

		mockToken = await MockToken.deploy();
		await mockToken.deployed();
		fakeToken = await FakeToken.deploy();
		await fakeToken.deployed();

		await mockToken.approve(issue.address, 10000000);
		await fakeToken.approve(issue.address, 10000000);
	});

	describe('Issue.sol receiveFunds', () => {

		describe('require and revert', () => {
			it('should revert if not called by owner', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();

				const funder = notOwner.address;
				const value = 10000;

				let issueWithNonOwnerAccount = issue.connect(notOwner);

				// ASSERT
				await expect(issueWithNonOwnerAccount.receiveFunds(funder, mockToken.address, value)).to.be.revertedWith('Ownable: caller is not the owner');
			});

			it('should revert if no value is sent', async () => {
				// ARRANGE
				const [, notOwner] = await ethers.getSigners();

				const funder = notOwner.address;
				const value = 0;

				// ASSERT
				await expect(issue.receiveFunds(funder, mockToken.address, value)).to.be.revertedWith('Must send some value');
			});
		});

		describe('isAFunder', () => {
			it('should set isAFunder to true for the deposit sender', async () => {
				// ARRANGE
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const isNotAFunder = await issue.isAFunder(funder);
				expect(isNotAFunder).to.be.false;

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const isAFunderNow = await issue.isAFunder(funder);
				expect(isAFunderNow).to.be.true;
			});
		});

		describe('bountyTokenAddresses', () => {
			it('should add that token address to tokenAddresses if its a new address', async () => {
				// ARRANGE
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const zeroLength = await issue.getBountyTokenAddresses();
				expect(zeroLength.length).to.equal(0);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const newTokenAddress = await issue.bountyTokenAddresses(0);
				expect(newTokenAddress).to.equal(mockToken.address);
			});

			it('should NOT add that token address to tokenAddresses if it is already there', async () => {
				// ARRANGE
				const [owner] = await ethers.getSigners();
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const zeroLength = await issue.getBountyTokenAddresses();
				expect(zeroLength.length).to.equal(0);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const newTokenAddress = await issue.bountyTokenAddresses(0);
				expect(newTokenAddress).to.equal(mockToken.address);

				const tokenAddresses = await issue.getBountyTokenAddresses();
				expect(tokenAddresses.length).to.equal(1);
			});
		});

		describe('funderTokenAddresses', () => {
			it('should add that token address to fundersTokenAddresses if its a new address', async () => {
				// ARRANGE
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const zeroLength = await issue.getFunderTokenAddresses(owner.address);
				expect(zeroLength.length).to.equal(0);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const fundersTokenAddress = await issue.getFunderTokenAddresses(owner.address);
				expect(fundersTokenAddress[0]).to.equal(mockToken.address);
			});

			it('should NOT add that token address to fundersTokenAddresses if its NOT a new address', async () => {
				// ARRANGE
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const zeroLength = await issue.getFunderTokenAddresses(owner.address);
				expect(zeroLength.length).to.equal(0);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const fundersTokenAddress = await issue.getFunderTokenAddresses(owner.address);
				expect(fundersTokenAddress[0]).to.equal(mockToken.address);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const fundersTokenNewAddress = await issue.getFunderTokenAddresses(owner.address);
				expect(fundersTokenNewAddress.length).to.equal(1);
			});
		});

		describe('bountyDeposits', () => {
			it('should increment bountyDeposits by value for that token address', async () => {
				// ARRANGE
				const funder = owner.address;
				const value = 10000;

				// ASSUME
				const zeroLength = await issue.getBountyTokenAddresses();
				expect(zeroLength.length).to.equal(0);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const newValue = await issue.bountyDeposits(mockToken.address);
				expect(newValue).to.equal(value);

				// ACT
				await issue.receiveFunds(funder, mockToken.address, value);

				// ASSERT
				const newerValue = await issue.bountyDeposits(mockToken.address);
				expect(newerValue).to.equal(value + value);

				// ACT
				await issue.receiveFunds(funder, fakeToken.address, value);

				// ASSERT
				const newValueOtherToken = await issue.bountyDeposits(fakeToken.address);
				expect(newValueOtherToken).to.equal(value);

				// ACT
				await issue.receiveFunds(funder, fakeToken.address, value);

				// ASSERT
				const newerValueOtherToken = await issue.bountyDeposits(fakeToken.address);
				expect(newerValueOtherToken).to.equal(value + value);
			});
		});

		describe('fundersDeposits', () => {
			it('should increment fundersDeposits at tokenAddress by value', async () => {
				// ARRANGE
				const value = 10000;

				// ASSUME
				const zeroValue = (await issue.funderDeposits(owner.address, mockToken.address)).toNumber();
				expect(zeroValue).to.equal(0);

				// ACT
				await issue.receiveFunds(owner.address, mockToken.address, value);

				// ASSERT
				const funderDepositsForTokenAddress = (await issue.funderDeposits(owner.address, mockToken.address)).toNumber();
				expect(funderDepositsForTokenAddress).to.equal(value);

				// ACT
				await issue.receiveFunds(owner.address, mockToken.address, value);

				// ASSERT
				const funderNewDeposits = (await issue.funderDeposits(owner.address, mockToken.address)).toNumber();
				expect(funderNewDeposits).to.equal(value + value);

				// ACT
				await issue.receiveFunds(owner.address, fakeToken.address, value);

				// ASSERT
				const funderNewDepositsOnOtherAddress = (await issue.funderDeposits(owner.address, fakeToken.address)).toNumber();
				expect(funderNewDepositsOnOtherAddress).to.equal(value);

				// ACT
				await issue.receiveFunds(owner.address, fakeToken.address, value);

				// ASSERT
				const funderNewDepositsOnOtherAddressNewer = (await issue.funderDeposits(owner.address, fakeToken.address)).toNumber();
				expect(funderNewDepositsOnOtherAddressNewer).to.equal(value + value);
			});
		});

		describe('transferFrom', () => {
			it('should transfer the resepctive amount from sender to this bounty address for the token address', async () => {
				// ASSUME
				const initialFunderMockTokenBalance = (await fakeToken.balanceOf(owner.address)).toString();
				const initialFunderFakeTokenBalance = (await mockToken.balanceOf(owner.address)).toString();
				expect(initialFunderMockTokenBalance).to.equal('10000000000000000000000');
				expect(initialFunderFakeTokenBalance).to.equal('10000000000000000000000');

				const initialIssueMockTokenBalance = (await mockToken.balanceOf(issue.address)).toString();
				const initialIssueFakeTokenBalance = (await fakeToken.balanceOf(issue.address)).toString();
				expect(initialIssueMockTokenBalance).to.equal('0');
				expect(initialIssueFakeTokenBalance).to.equal('0');

				// ARRANGE
				const value = 100;

				// ACT
				await issue.receiveFunds(owner.address, mockToken.address, value);
				await issue.receiveFunds(owner.address, fakeToken.address, value);

				// ASSERT
				const funderMockTokenBalance = (await fakeToken.balanceOf(owner.address)).toString();
				const funderFakeTokenBalance = (await mockToken.balanceOf(owner.address)).toString();
				expect(funderMockTokenBalance).to.equal('9999999999999999999900');
				expect(funderFakeTokenBalance).to.equal('9999999999999999999900');

				const issueMockTokenBalance = (await mockToken.balanceOf(issue.address)).toString();
				const issueFakeTokenBalance = (await fakeToken.balanceOf(issue.address)).toString();
				expect(issueMockTokenBalance).to.equal('100');
				expect(issueFakeTokenBalance).to.equal('100');
			});
		});
	});
});