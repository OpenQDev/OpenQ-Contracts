const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function verifyContracts() {
	console.log('\n------------------------------------------');
	console.log(`VERIFYING OPENQ IMPLEMENTATION CONTRACT on ${hre.network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	await hre.run('verify:verify', {
		address: process.env.OPENQ_IMPLEMENTATION_ADDRESS,
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