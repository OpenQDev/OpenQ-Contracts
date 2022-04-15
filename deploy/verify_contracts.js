const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function verifyContracts() {
	console.log('\n------------------------------------------');
	console.log(`VERIFYING OPENQ CONTRACTS on ${hre.network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	console.log('Verifying OpenQV0');
	await hre.run('verify:verify', {
		address: process.env.OPENQ_IMPLEMENTATION_ADDRESS,
	});

	console.log('Verifying BountyV0');
	await hre.run('verify:verify', {
		address: process.env.OPENQ_BOUNTY_IMPLEMENTATION_ADDRESS,
	});

	console.log('Verifying BountyFactory');
	await hre.run('verify:verify', {
		address: process.env.OPENQ_BOUNTY_FACTORY_ADDRESS,
		constructorArguments: [
			process.env.OPENQ_ADDRESS
		]
	});

	console.log('Verifying OpenQStorage');
	await hre.run('verify:verify', {
		address: process.env.OPENQ_STORAGE_ADDRESS,
	});

	console.log('Verifying OpenQTokenWhitelist');
	await hre.run('verify:verify', {
		address: process.env.OPENQ_TOKEN_WHITELIST_ADDRESS,
		constructorArguments: [
			20
		]
	});
}

async function main() {
	await verifyContracts();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = verifyContracts;