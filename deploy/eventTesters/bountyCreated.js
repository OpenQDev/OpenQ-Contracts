const { ethers } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.contracts') });
const atomicBountyNoFundingGoalInitOperation = require('./initData_AtomicNoFundingGoal');
const atomicBountyInitOperation = require('./initData_AtomicFundingGoal');

async function deployOpenQ() {
	const OpenQ = await ethers.getContractFactory('OpenQV1');

	// We fetch the contract factory for the implementation contract (OpenQV1) but attach it to the address of OpenQProxy
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	const id = (Math.random(1)*100).toString();
	const txn = await openQ.mintBounty(id, 'MDEyOk9yZ2FuaXphdGlvbjc3NDAyNTM4', atomicBountyInitOperation);
	const receipt = await txn.wait();
	const bountyCreatedEvent = receipt.events.find(eventObj => eventObj.event === 'BountyCreated');
	console.log(bountyCreatedEvent);
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