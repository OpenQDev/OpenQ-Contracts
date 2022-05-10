const { ethers } = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function fundBounties() {
	console.log('\n------------------------------------------');
	console.log('FUNDING BOUNTIES with MOCK LINK and DUMMY ERC20');
	console.log('------------------------------------------');
	const MockLink = await ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.attach(process.env.MOCK_LINK_TOKEN_ADDRESS);

	const MockDai = await ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.attach(process.env.MOCK_DAI_TOKEN_ADDRESS);

	const OpenQ = await ethers.getContractFactory('OpenQV0');
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGWnnz85GjwA1', 'I_kwDOGAqhQc48U5_r', 'I_kwDOGWnnz84-qyDq', 'I_kwDOGWnnz85CZwGJ', 'I_kwDOGWnnz85AkiDt'];
	const githubIssueIdsOtherOrgs = ['I_kwDOCHE8585AYvGo', 'I_kwDOGWnnz85AkkDW'];

	const bounty1Address = await openQ.bountyIdToAddress(githubIssueIdsOtherOrgs[0]);
	const bounty2Address = await openQ.bountyIdToAddress(githubIssueIds[1]);
	const bounty3Address = await openQ.bountyIdToAddress(githubIssueIds[5]);


	// Pre-load with some deposits
	const one = ethers.BigNumber.from('1000000000000000000');
	const two = ethers.BigNumber.from('2000000000000000000');
	const four = ethers.BigNumber.from('4000000000000000000');
	const eight = ethers.BigNumber.from('8000000000000000000');

	await mockLink.approve(bounty1Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(bounty1Address, eight);
	await optionalSleep(5000);

	await mockLink.approve(bounty2Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(bounty2Address, eight);
	await optionalSleep(5000);

	await mockLink.approve(bounty3Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(bounty3Address, eight);
	await optionalSleep(5000);

	const thirtySeconds = 30;
	const fifteenDays = 1296000;
	const thirtyDays = 2592000;

	console.log('Funding approved for Client 1');
	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtySeconds);
	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtySeconds);
	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtySeconds);
	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtySeconds);
	await optionalSleep(5000);
	console.log('Funded  for Client 1');

	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtyDays);
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIdsOtherOrgs[0], mockDai.address, two, thirtySeconds);
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[1], mockLink.address, one, fifteenDays);
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[1], mockDai.address, two, thirtySeconds);
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[1], ethers.constants.AddressZero, one, fifteenDays, { value: one });
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[5], ethers.constants.AddressZero, one, thirtySeconds, { value: one });
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[5], ethers.constants.AddressZero, one, thirtySeconds, { value: one });
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[5], mockDai.address, two, fifteenDays);
	await optionalSleep(5000);

	await openQ.fundBountyToken(githubIssueIds[5], mockLink.address, two, thirtySeconds);
	await optionalSleep(5000);

	console.log('Funding succeeded for Client 1');

	// Contributor 2
	const [, contributor] = await ethers.getSigners();

	console.log('Transferring LINK and DERC20 to Client 2');
	await mockDai.transfer(contributor.address, two);
	await optionalSleep(5000);

	await mockLink.transfer(contributor.address, two);
	await optionalSleep(5000);
	console.log('Transfer to Client 2 succeeded');

	await mockLink.connect(contributor).approve(bounty1Address, one);
	await optionalSleep(5000);

	await mockDai.connect(contributor).approve(bounty1Address, two);
	await optionalSleep(5000);

	await mockLink.connect(contributor).approve(bounty2Address, one);
	await optionalSleep(5000);

	await mockDai.connect(contributor).approve(bounty2Address, two);
	await optionalSleep(5000);

	console.log('Funding approved for Client 2');

	await openQ.connect(contributor).fundBountyToken(githubIssueIdsOtherOrgs[0], mockLink.address, one, thirtyDays);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBountyToken(githubIssueIdsOtherOrgs[0], mockDai.address, one, thirtySeconds);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBountyToken(githubIssueIds[1], mockLink.address, one, fifteenDays);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBountyToken(githubIssueIds[1], mockDai.address, one, thirtyDays);
	await optionalSleep(5000);

	console.log('Funding succeeded for Client 2');

	console.log('\nBounties funded successfully!\n');
}

async function main() {
	await fundBounties();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = fundBounties;