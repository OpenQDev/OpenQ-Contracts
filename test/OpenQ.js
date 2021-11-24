/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');

describe('OpenQ.sol mintBounty', () => {
	let openQ;

	beforeEach(async () => {
		const OpenQ = await hre.ethers.getContractFactory('OpenQ');
		openQ = await OpenQ.deploy();
		await openQ.deployed();
	});

	it('should deploy a new issue contract with expected initial metadata', async () => {
		// ARRANGE
		const expectedTimestamp = await setNextBlockTimestamp();

		const newIssueId = 'mockIssueId';

		// ACT
		const [owner] = await ethers.getSigners();
		await openQ.mintBounty(newIssueId);

		const issueIsOpen = await openQ.issueIsOpen(newIssueId);
		const issueAddress = await openQ.issueToAddress(newIssueId);

		const Issue = await hre.ethers.getContractFactory('Issue');

		const newIssue = await Issue.attach(
			issueAddress
		);

		const issueId = await newIssue.issueId();
		const issueCreatedTime = (await newIssue.issueCreatedTime()).toNumber();
		const issueClosedTime = await newIssue.issueClosedTime();
		const escrowPeriod = (await newIssue.escrowPeriod()).toNumber();
		const issuer = await newIssue.issuer();
		const closer = await newIssue.closer();
		const status = await newIssue.status();

		// ASSERT
		expect(issueId).to.equal(newIssueId);
		expect(issueCreatedTime).to.equal(expectedTimestamp);
		expect(issueClosedTime).to.equal(0);
		expect(escrowPeriod).to.equal(2592000);
		expect(issuer).to.equal(owner.address);
		expect(closer).to.equal(hre.ethers.constants.AddressZero);
		expect(status).to.equal(0);

		const issueIdFromAddress = await openQ.addressToIssue(issueAddress);
		expect(issueIdFromAddress).to.equal(newIssueId);
	});

	it('should revert if bounty already exists', async () => {
		// ARRANGE
		const issueId = 'mockIssueId';

		// ACT
		await openQ.mintBounty(issueId);

		// ASSERT
		await expect(openQ.mintBounty(issueId)).to.be.revertedWith('Issue already exists for given id. Find its address by calling issueToAddress on this contract with the issueId');
	});

	it('should emit an IssueCreated event with expected issueId, issuer address, issue address, and issueMintTime', async () => {
		// ARRANGE
		const [owner] = await ethers.getSigners();
		const issueId = 'mockIssueId';
		const issueAddress = "0x553BED26A78b94862e53945941e4ad6E4F2497da";

		const expectedTimestamp = await setNextBlockTimestamp();

		// ACT
		// ASSERT
		await expect(openQ.mintBounty(issueId))
			.to.emit(openQ, 'IssueCreated')
			.withArgs(issueId, owner.address, issueAddress, expectedTimestamp);
	});
});

describe('OpenQ.sol fundBounty', () => {
	let openQ;

	beforeEach(async () => {
		const OpenQ = await hre.ethers.getContractFactory('OpenQ');
		openQ = await OpenQ.deploy();
		await openQ.deployed();
	});

	it('should emit a FundsReceived event with expected issueId, issue address, token address, funder, value and timestamp', async () => {
		// ARRANGE
		const [owner] = await ethers.getSigners();
		const issueId = 'mockIssueId';
		const tokenAddress = "0x553BED26A78b94862e53945941e4ad6E4F2497da";

		await openQ.mintBounty(issueId);

		const issueAddress = await openQ.issueToAddress(issueId);

		const Issue = await hre.ethers.getContractFactory('Issue');

		const issue = await Issue.attach(
			issueAddress
		);

		const expectedTimestamp = await setNextBlockTimestamp();

		// ACT
		// ASSERT
		await expect(openQ.fundBounty(issue.address, tokenAddress, 100))
			.to.emit(openQ, 'FundsReceived')
			.withArgs(issueId, issueAddress, tokenAddress, owner.address, 100, expectedTimestamp);
	});
});

describe('OpenQ.sol claimBounty', () => {
	let openq;

	beforeEach(async () => {
		const OpenQ = await hre.ethers.getContractFactory('OpenQ');
		openQ = await OpenQ.deploy();
		await openQ.deployed();
	});

	it('claimBounty should revert if not called by owner', async () => {
		// ARRANGE
		const [owner, notOwner] = await ethers.getSigners();
		const issueId = 'mockIssueId';
		let openQWithNonOwnerAccount = openQ.connect(notOwner);
		const payoutAddress = '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690';

		// ASSERT
		await expect(openQWithNonOwnerAccount.claimBounty(issueId, payoutAddress)).to.be.revertedWith('Ownable: caller is not the owner');
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
