const { ethers, network } = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
const { openQIssueIds, otherOrgIssueIds, otherOrgIssueOwners } = require('./gitHubIssueIds.json');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function deployBounties() {
	console.log('\n------------------------------------------');
	console.log(`DEPLOYING BOUNTIES to ${network.name.toUpperCase()}`);
	console.log('------------------------------------------');
	const OpenQ = await ethers.getContractFactory('OpenQV1');

	// We fetch the contract factory for the implementation contract (OpenQV1) but attach it to the address of OpenQProxy
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	// PREPARE INITIALIZATION DATA
	let abiCoder = new ethers.utils.AbiCoder;

	// ATOMIC CONTRACT                              
	const abiEncodedParamsAtomicNoFundingGoal = abiCoder.encode(['bool', 'address', 'uint256' , 'bool' , 'bool', 'bool' , 'string', 'string' , 'string'], [false, ethers.constants.AddressZero, 0, true, true, true, 'po', 'po', 'po']);
	let atomicBountyNoFundingGoalInitOperation = [0, abiEncodedParamsAtomicNoFundingGoal];
	
	const abiEncodedParamsAtomic = abiCoder.encode(['bool', 'address', 'uint256' , 'bool' , 'bool', 'bool' , 'string', 'string' , 'string'], [true, process.env.MOCK_LINK_TOKEN_ADDRESS, 100, true, true, true, 'po', 'po', 'po']);
	let atomicBountyInitOperation = [0, abiEncodedParamsAtomic];

	// CONTEST
	const abiEncodedParamsTieredFixedBounty = abiCoder.encode(['uint256[]', 'address', 'bool', 'bool', 'bool', 'string', 'string', 'string'], [[80, 20], process.env.MOCK_LINK_TOKEN_ADDRESS, true, true, true, '', '', '']);
	let tieredFixedBountyInitOperation = [3, abiEncodedParamsTieredFixedBounty];

	// DEPLOY CONTRACTS


	// ATOMIC CONTRACT
	console.log('Minting Atomic Contract with no funding goal...');
	await openQ.mintBounty(openQIssueIds[0], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', atomicBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with no funding goal deployed!');

	console.log('Minting Atomic Contract with funding goal...');
	await openQ.mintBounty(openQIssueIds[1], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', atomicBountyInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with funding goal deployed!');
	
	console.log('Minting Atomic Contract with no funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[0], otherOrgIssueOwners[0], atomicBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with no funding goal deployed!');

	console.log('Minting Atomic Contract with funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[1], otherOrgIssueOwners[1], atomicBountyInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with funding goal deployed!');

	// CONTEST
	console.log('Minting Contest fixed contract...');
	await openQ.mintBounty(openQIssueIds[6], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', tieredFixedBountyInitOperation);
	await optionalSleep(10000);
	console.log('Minting Contest fixed contract deployed!');

	console.log('Minting Contest fixed contract...');
	await openQ.mintBounty(otherOrgIssueIds[6], otherOrgIssueOwners[6], tieredFixedBountyInitOperation);
	await optionalSleep(10000);
	console.log('Minting Contest fixed contract deployed!');

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