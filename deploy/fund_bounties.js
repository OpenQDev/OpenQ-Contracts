const hre = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function fundBounties() {
	console.log('\n------------------------------------------');
	console.log('FUND BOUNTIES');
	console.log('------------------------------------------');
	const MockLink = await hre.ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.attach(process.env.MOCK_LINK_TOKEN_ADDRESS);

	const MockDai = await hre.ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.attach(process.env.MOCK_DAI_TOKEN_ADDRESS);

	const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGAqhQc48U54v', 'I_kwDOGAqhQc48U5_r', 'I_kwDOGWnnz84-qyDq'];
	const githubIssueIdsOtherOrgs = ['I_kwDOD3_dQM5APoQW', 'I_kwDOAOvK984_H_5E', 'MDU6SXNzdWU4MzYyNjUzMzc=', 'I_kwDOCHE8585AYvGo', 'I_kwDOGWnnz85AkkDW'];

	const bounty1Address = await openQ.bountyIdToAddress(githubIssueIdsOtherOrgs[4]);
	const bounty2Address = await openQ.bountyIdToAddress(githubIssueIds[1]);


	// Pre-load with some deposits
	const one = hre.ethers.BigNumber.from('1000000000000000000');
	const two = hre.ethers.BigNumber.from('2000000000000000000');
	const four = hre.ethers.BigNumber.from('4000000000000000000');

	await mockLink.approve(bounty1Address, one);
	await optionalSleep(5000);

	await mockDai.approve(bounty1Address, two);
	await optionalSleep(5000);

	await mockLink.approve(bounty2Address, one);
	await optionalSleep(5000);

	await mockDai.approve(bounty2Address, two);
	await optionalSleep(5000);

	console.log('Funding approved for Client 1');

	await openQ.fundBounty(bounty1Address, mockLink.address, one);
	await optionalSleep(5000);

	await openQ.fundBounty(bounty1Address, mockDai.address, two);
	await optionalSleep(5000);

	await openQ.fundBounty(bounty2Address, mockLink.address, one);
	await optionalSleep(5000);

	await openQ.fundBounty(bounty2Address, mockDai.address, two);
	await optionalSleep(5000);

	console.log('Funding succeeded for Client 1');

	// Contributor 2
	const [, contributor] = await hre.ethers.getSigners();

	console.log('Transferring mLink and mDai to Client 2');
	await mockDai.transfer(contributor.address, four);
	await optionalSleep(5000);

	await mockLink.transfer(contributor.address, four);
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

	await openQ.connect(contributor).fundBounty(bounty1Address, mockLink.address, one);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBounty(bounty1Address, mockDai.address, two);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBounty(bounty2Address, mockLink.address, one);
	await optionalSleep(5000);

	await openQ.connect(contributor).fundBounty(bounty2Address, mockDai.address, two);
	await optionalSleep(5000);

	console.log('Funding succeeded for Client 2');

	console.log('\nBounties funded successfully!\n');
}

module.exports = fundBounties;