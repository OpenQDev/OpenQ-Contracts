const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function verifyContracts() {
	console.log('\n------------------------------------------');
	console.log(`VERIFYING OPENQ CONTRACTS on ${hre.network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	try {
		console.log('Verifying OpenQProxy');
		await hre.run('verify:verify', {
			address: process.env.OPENQ_PROXY_ADDRESS,
			constructorArguments: [
				process.env.OPENQ_IMPLEMENTATION_ADDRESS,
				[]
			],
			contract: 'contracts/OpenQ/Proxy/OpenQProxy.sol:OpenQProxy'
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying OpenQV1');
		await hre.run('verify:verify', {
			address: process.env.OPENQ_IMPLEMENTATION_ADDRESS,
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying ClaimManager');
		await hre.run('verify:verify', {
			address: process.env.CLAIM_MANAGER_IMPLEMENTATION_ADDRESS,
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying DepositManager');
		await hre.run('verify:verify', {
			address: process.env.DEPOSIT_MANAGER_IMPLEMENTATION_ADDRESS,
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying AtomicBountyV1');
		await hre.run('verify:verify', {
			address: process.env.ATOMIC_BOUNTY_IMPLEMENTATION,
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying TieredFixedBountyV1');
		await hre.run('verify:verify', {
			address: process.env.TIERED_FIXED_BOUNTY_IMPLEMENTATION,
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying AtomicBountyBeacon');
		await hre.run('verify:verify', {
			address: process.env.ATOMIC_BOUNTY_BEACON_ADDRESS,
			constructorArguments: [
				process.env.ATOMIC_BOUNTY_IMPLEMENTATION
			],
			contract: 'contracts/Bounty/Proxy/BountyBeacon.sol:BountyBeacon'
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying TieredFixedBountyBeacon');
		await hre.run('verify:verify', {
			address: process.env.TIERED_FIXED_BOUNTY_BEACON_ADDRESS,
			constructorArguments: [
				process.env.TIERED_FIXED_BOUNTY_IMPLEMENTATION
			],
			contract: 'contracts/Bounty/Proxy/BountyBeacon.sol:BountyBeacon'
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying BountyFactory');
		await hre.run('verify:verify', {
			address: process.env.OPENQ_BOUNTY_FACTORY_ADDRESS,
			constructorArguments: [
				process.env.OPENQ_PROXY_ADDRESS,
				process.env.ATOMIC_BOUNTY_BEACON_ADDRESS,
				process.env.TIERED_FIXED_BOUNTY_BEACON_ADDRESS
			]
		});
	} catch (error) {
		console.log(error);
	}

	try {
		console.log('\nVerifying OpenQTokenWhitelist');
		await hre.run('verify:verify', {
			address: process.env.OPENQ_TOKEN_WHITELIST_ADDRESS
		});
	} catch (error) {
		console.log(error);
	}

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