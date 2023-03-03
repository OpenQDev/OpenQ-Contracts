const { ethers, network } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

// Array of all supported tokens
const polygonMainnetTokens = require('../constants/polygon-mainnet-tokens.json');
const localTokens = require('../constants/local-tokens.json');

async function configureWhitelist() {
	console.log('\n------------------------------------------');
	console.log(`CONFIGURING OPENQ TOKEN WHITELIST on ${network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	let tokenMetadata;
	switch (network.name) {
	case 'docker':
		tokenMetadata = localTokens;
		break;
	case 'localhost':
		tokenMetadata = localTokens;
		break;
	case 'polygon':
		tokenMetadata = polygonMainnetTokens;
		break;
	default:
		throw Error('NO CORRECT NETWORK');
	}

	const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
	const openQTokenWhitelist = await OpenQTokenWhitelist.attach(process.env.OPENQ_TOKEN_WHITELIST_ADDRESS);

	console.log('\nConfiguring OpenQTokenWhitelist with default tokens...');

	for (let token of tokenMetadata) {
		console.log(`Adding ${token.name} at address ${token.address}`);
		await openQTokenWhitelist.addToken(token.address);
	}

	console.log('OpenQTokenWhitelist successfully configured with default tokens');
}

async function main() {
	await configureWhitelist();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = configureWhitelist;