const { ethers, network } = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
const { openQIssueIds, otherOrgIssueIds, otherOrgIssueOwners } = require('./gitHubIssueIds.json');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function deployBounties() {
	console.log('\n------------------------------------------');
	console.log(`DEPLOYING BOUNTIES to ${network.name.toUpperCase()}`);
	console.log('------------------------------------------');
	const OpenQ = await ethers.getContractFactory('OpenQV3');

	// We fetch the contract factory for the implementation contract (OpenQV2) but attach it to the address of OpenQProxy
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	// PREPARE INITIALIZATION DATA
	let abiCoder = new ethers.utils.AbiCoder;

	// ATOMIC CONTRACT
	const abiEncodedParamsAtomic = abiCoder.encode(['bool', 'address', 'uint256', 'bool', 'bool'], [true, process.env.MOCK_LINK_TOKEN_ADDRESS, 100, true, true]);
	let atomicBountyInitOperation = [0, abiEncodedParamsAtomic];

	const abiEncodedParamsAtomicNoFundingGoal = abiCoder.encode(['bool', 'address', 'uint256', 'bool', 'bool'], [false, ethers.constants.AddressZero, 0, true, true]);
	let atomicBountyNoFundingGoalInitOperation = [0, abiEncodedParamsAtomicNoFundingGoal];

	// ONGOING

	const abiEncodedParamsOngoing = abiCoder.encode(['address', 'uint256', 'bool', 'address', 'uint256', 'bool', 'bool'], [process.env.MOCK_LINK_TOKEN_ADDRESS, '100', true, process.env.MOCK_LINK_TOKEN_ADDRESS, '1000', true, true]);
	let ongoingBountyInitOperation = [1, abiEncodedParamsOngoing];

	const abiEncodedParamsOngoingNoFundingGoal = abiCoder.encode(['address', 'uint256', 'bool', 'address', 'uint256', 'bool', 'bool'], [process.env.MOCK_LINK_TOKEN_ADDRESS, '100', false, ethers.constants.AddressZero, 0, true, true]);
	let ongoingBountyNoFundingGoalInitOperation = [1, abiEncodedParamsOngoingNoFundingGoal];

	// CONTEST
	const abiEncodedParamsContestPercentage = abiCoder.encode(['uint256[]', 'bool', 'address', 'uint256', 'bool', 'bool'], [[70, 20, 10], true, process.env.MOCK_LINK_TOKEN_ADDRESS, 100, true, true]);
	let contestPercentageInitOperation = [2, abiEncodedParamsContestPercentage];

	const abiEncodedParamsContestPercentageNoFundingGoal = abiCoder.encode(['uint256[]', 'bool', 'address', 'uint256', 'bool', 'bool'], [[70, 20, 10], false, ethers.constants.AddressZero, 0, true, true]);
	let contestPercentageNoFundingGoalInitOperation = [2, abiEncodedParamsContestPercentageNoFundingGoal];

	const abiEncodedParamsContestFixed = abiCoder.encode(['uint256[]', 'address', 'bool', 'bool'], [[300, 100], process.env.MOCK_LINK_TOKEN_ADDRESS, true, true]);
	let contestFixedInitOperation = [3, abiEncodedParamsContestFixed];

	// DEPLOY CONTRACTS


	// ATOMIC CONTRACT
	console.log('Minting Atomic Contract with no funding goal...');
	await openQ.mintBounty(openQIssueIds[0], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', atomicBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with no funding goal deployed!');

	console.log('Minting Atomic Contract with no funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[0], otherOrgIssueOwners[0], atomicBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with no funding goal deployed!');

	console.log('Minting Atomic Contract with funding goal...');
	await openQ.mintBounty(openQIssueIds[1], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', atomicBountyInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with funding goal deployed!');

	console.log('Minting Atomic Contract with funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[1], otherOrgIssueOwners[1], atomicBountyInitOperation);
	await optionalSleep(10000);
	console.log('Atomic Contract with funding goal deployed!');

	// ONGOING
	console.log('Minting Ongoing contract with no funding goal...');
	await openQ.mintBounty(openQIssueIds[2], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', ongoingBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Ongoing contract with no funding goal deployed!');

	console.log('Minting Ongoing contract with no funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[2], otherOrgIssueOwners[2], ongoingBountyNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Ongoing contract with no funding goal deployed!');

	console.log('Minting Ongoing contract with funding goal...');
	await openQ.mintBounty(openQIssueIds[3], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', ongoingBountyInitOperation);
	await optionalSleep(10000);
	console.log('Ongoing contract with funding goal deployed!');

	console.log('Minting Ongoing contract with funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[3], otherOrgIssueOwners[3], ongoingBountyInitOperation);
	await optionalSleep(10000);
	console.log('Ongoing contract with funding goal deployed!');

	// CONTEST
	console.log('Minting Contest percentage contract with funding goal...');
	await openQ.mintBounty(openQIssueIds[4], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', contestPercentageInitOperation);
	await optionalSleep(10000);
	console.log('Contest percentage contract with funding goal deployed!');

	console.log('Minting Contest percentage contract with funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[4], otherOrgIssueOwners[4], contestPercentageInitOperation);
	await optionalSleep(10000);
	console.log('Contest percentage contract with funding goal deployed!');

	console.log('Minting Contest percentage contract with no funding goal...');
	await openQ.mintBounty(openQIssueIds[5], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', contestPercentageNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Contest percentage contract with no  funding goal deployed!');

	console.log('Minting Contest percentage contract with no funding goal...');
	await openQ.mintBounty(otherOrgIssueIds[5], otherOrgIssueOwners[5], contestPercentageNoFundingGoalInitOperation);
	await optionalSleep(10000);
	console.log('Contest percentage contract with no  funding goal deployed!');

	console.log('Minting Contest fixed contract...');
	await openQ.mintBounty(openQIssueIds[6], 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', contestFixedInitOperation);
	await optionalSleep(10000);
	console.log('Minting Contest fixed contract deployed!');

	console.log('Minting Contest fixed contract...');
	await openQ.mintBounty(otherOrgIssueIds[6], otherOrgIssueOwners[6], contestFixedInitOperation);
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