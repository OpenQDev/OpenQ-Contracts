/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');

describe('OpenQ.sol', () => {
	it('mintBounty method should create a new open bounty with expected initial metadata', async () => {
		// ARRANGE
		const OpenQ = await hre.ethers.getContractFactory('OpenQ');
		const openQ = await OpenQ.deploy();

		// Manually set timestamp for next block
		const expectedTimestamp = 1953282725;
		await network.provider.send("evm_setNextBlockTimestamp", [expectedTimestamp]);

		// ACT
		await openQ.mintBounty('mockIssueId');

		// ASSERT
		const issueIsOpen = await openQ.issueIsOpen('mockIssueId');
		const issueAddress = await openQ.issueToAddress('mockIssueId');

		const Issue = await hre.ethers.getContractFactory('Issue');

		const newIssue = await Issue.attach(
			issueAddress// The deployed contract address
		);

		const issueId = await newIssue.issueId();
		const issueCreatedTime = (await newIssue.issueCreatedTime()).toNumber();
		const issueClosedTime = await newIssue.issueClosedTime();
		const escrowPeriod = (await newIssue.escrowPeriod()).toNumber();
		const issuer = await newIssue.issuer();
		const closer = await newIssue.closer();
		const status = await newIssue.status();

		expect(issueId).to.equal("mockIssueId");
		expect(issueCreatedTime).to.equal(expectedTimestamp);
		expect(issueClosedTime).to.equal(0);
		expect(escrowPeriod).to.equal(2592000);
		expect(issuer).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
		expect(closer).to.equal("0x0000000000000000000000000000000000000000");
		expect(status).to.equal(0);
	});
});