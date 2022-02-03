const hre = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function deployBounties() {
	console.log('\n------------------------------------------');
	console.log('DEPLOY BOUNTIES');
	console.log('------------------------------------------');
	const OpenQ = await hre.ethers.getContractFactory('OpenQV0');

	// We fetch the contract factory for the implementation contract (OpenQV0) but attach it to the address of OpenQProxy
	const openQ = await OpenQ.attach(process.env.OPENQ_ADDRESS);

	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGAqhQc48U54v', 'I_kwDOGAqhQc48U5_r', 'I_kwDOGWnnz84-qyDq', 'I_kwDOGWnnz85CZwGJ', 'I_kwDOGWnnz85AkiDt'];
	const githubIssueIdsOtherOrgs = ['I_kwDOCHE8585AYvGo', 'I_kwDOGWnnz85AkkDW'];

	console.log('Minting Bounty 1...');
	await openQ.mintBounty(githubIssueIds[0], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 1 deployed');

	console.log('Minting Bounty 1.5...');
	await openQ.mintBounty(githubIssueIds[4], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 1.5 deployed');

	console.log('Minting Bounty 1.75...');
	await openQ.mintBounty(githubIssueIds[5], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 1.75 deployed');

	console.log('Minting Bounty 2...');
	await openQ.mintBounty(githubIssueIds[1], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 2 deployed');

	console.log('Minting Bounty 3...');
	await openQ.mintBounty(githubIssueIds[2], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 3 deployed');

	console.log('Minting Bounty 4...');
	await openQ.mintBounty(githubIssueIds[3], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 4 deployed');

	// console.log('Minting Bounty 5...');
	// await openQ.mintBounty(githubIssueIdsOtherOrgs[0], 'Uniswap');
	// await optionalSleep(10000);
	// console.log('Bounty 5 deployed');

	// console.log('Minting Bounty 6...');
	// await openQ.mintBounty(githubIssueIdsOtherOrgs[1], 'ethereum');
	// await optionalSleep(10000);
	// console.log('Bounty 6 deployed');

	// console.log('Minting Bounty 7...');
	// await openQ.mintBounty(githubIssueIdsOtherOrgs[2], 'balancer-labs');
	// await optionalSleep(10000);
	// console.log('Bounty 7 deployed');

	console.log('Minting Bounty 8...');
	await openQ.mintBounty(githubIssueIdsOtherOrgs[0], 'ProjectOpenSea');
	await optionalSleep(10000);
	console.log('Bounty 8 deployed');

	console.log('Minting Bounty 9...');
	await openQ.mintBounty(githubIssueIdsOtherOrgs[1], 'OpenQDev');
	await optionalSleep(10000);
	console.log('Bounty 9 deployed');

	// await sleep(2000);

	// const bounty1Address = await openQ.bountyIdToAddress(githubIssueIds[0]);
	// const bounty2Address = await openQ.bountyIdToAddress(githubIssueIds[1]);
	// const bounty3Address = await openQ.bountyIdToAddress(githubIssueIds[2]);
	// const bounty4Address = await openQ.bountyIdToAddress(githubIssueIds[3]);

	// const bounty5Address = await openQ.bountyIdToAddress(githubIssueIds[0]);
	// const bounty6Address = await openQ.bountyIdToAddress(githubIssueIds[1]);
	// const bounty7Address = await openQ.bountyIdToAddress(githubIssueIds[2]);
	// const bounty8Address = await openQ.bountyIdToAddress(githubIssueIds[3]);

	// console.log(`Bounty 1 with id ${githubIssueIds[0]} minted to ${bounty1Address}`);
	// console.log(`Bounty 2 with id ${githubIssueIds[1]} minted to ${bounty2Address}`);
	// console.log(`Bounty 3 with id ${githubIssueIds[2]} minted to ${bounty3Address}`);
	// console.log(`Bounty 4 with id ${githubIssueIds[3]} minted to ${bounty4Address}`);
	// console.log(`Bounty 5 with id ${githubIssueIdsOtherOrgs[0]} minted to ${bounty5Address}`);
	// console.log(`Bounty 6 with id ${githubIssueIdsOtherOrgs[1]} minted to ${bounty6Address}`);
	// console.log(`Bounty 7 with id ${githubIssueIdsOtherOrgs[2]} minted to ${bounty7Address}`);
	// console.log(`Bounty 8 with id ${githubIssueIdsOtherOrgs[3]} minted to ${bounty8Address}`);

	console.log('\nBounties Deployed Successfully!');
}

async function main() {
	await deployBounties();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = deployBounties;