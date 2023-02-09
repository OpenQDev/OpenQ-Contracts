const { ethers, network } = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
const { allOrgs, allIds } = require('./gitHubIssueIds.json');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

// Fill this up with mock data
const { boolean, uint256, string, address, tieredPercentage_payoutSchedule } = require('./fuzz_data.json');

// This adds it to the array prototype so you can call it like boolean.random()
Array.prototype.random = function() {
	return this[Math.floor(Math.random() * this.length)];
};

const getRandomBountyType = () => {
	return Math.floor(Math.random() * 4);
};

// This adds a method to bound the scope of input as needed. May come in handy like uint256.random().limitToRange(5) for bounty type
Number.prototype.limitToRange = function(upperBoundExclusive) {
	return Math.min(Math.max(this, 0), upperBoundExclusive);
};

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
	for (let i=0; i < allIds.length; i++) {
		const githubId = allIds[i];
		const orgId = allOrgs[i];

		const bountyType = getRandomBountyType();
		let initOperation;

		if (bountyType == 0) {
			const abiEncodedParamsAtomic = abiCoder.encode(
				['bool', 'address', 'uint256' , 'bool' , 'bool', 'bool' , 'string', 'string' , 'string'], 
				[boolean.random(), address.random(), uint256.random(), boolean.random(), boolean.random(), boolean.random(), string.random(), string.random(), string.random()]);
			initOperation = [0, abiEncodedParamsAtomic];
		} else if (bountyType == 1) {
			const abiEncodedParamsOngoing = abiCoder.encode(
				['address', 'uint256', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
				[address.random(), uint256.random(), true, address.random(), uint256.random(), boolean.random(), boolean.random(), boolean.random(), string.random(), string.random(), string.random()]);
			initOperation = [1, abiEncodedParamsOngoing];
		} else if (bountyType == 2) {
			const abiEncodedParamsContestPercentage = abiCoder.encode(
				['uint256[]', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
				[tieredPercentage_payoutSchedule.random(), boolean.random(), address.random(), uint256.random(), boolean.random(), boolean.random(), boolean.random(), string.random(), string.random(), string.random()]);
			initOperation = [2, abiEncodedParamsContestPercentage];
		} else if (bountyType == 3) {
			const abiEncodedParamsTieredFixedBounty = abiCoder.encode(
				['uint256[]', 'address', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
				[[uint256.random(), uint256.random()], address.random(), boolean.random(), boolean.random(), boolean.random(), string.random(), string.random(), string.random()]);
			initOperation = [3, abiEncodedParamsTieredFixedBounty];
		} else {
			throw new Error('Unknown Bounty Type');
		}
	
		console.log(`Minting bounty type ${bountyType}...`);
		await openQ.mintBounty(githubId, orgId, initOperation);
		await optionalSleep(10000);
		console.log('Contract deployed!');
	}

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