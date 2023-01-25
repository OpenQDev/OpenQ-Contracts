const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.contracts') });
const atomic_NoFundingGoal = require('./atomic_NoFundingGoal');
const atomic_FundingGoal = require('./atomic_FundingGoal');
const ongoing_FundingGoal = require('./ongoing_FundingGoal');
const ongoing_NoFundingGoal = require('./ongoing_NoFundingGoal');
const tieredPercentage_FundingGoal = require('./tieredPercentage_FundingGoal');
const tieredPercentage_NoFundingGoal = require('./tieredPercentage_NoFundingGoal');

async function deployOpenQ() {
	const OpenQ = await ethers.getContractFactory('OpenQV1');

	// We fetch the contract factory for the implementation contract (OpenQV1) but attach it to the address of OpenQProxy
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	const id = (Math.random(1)*100).toString();
	const txn = await openQ.mintBounty(id, 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', tieredPercentage_NoFundingGoal);
	const receipt = await txn.wait();
	const bountyCreatedEvent = receipt.events.find(eventObj => eventObj.event === 'BountyCreated');
	console.log(bountyCreatedEvent);

	const bountyId = `OPENQ_PROXY_ADDRESS=${id}`;

	fs.writeFileSync('.env.bounty', bountyId);
}

async function main() {
	await deployOpenQ();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = deployOpenQ;