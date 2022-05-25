const { ethers, network } = require('hardhat');
const fs = require('fs');
const { optionalSleep } = require('./utils');
require('dotenv').config();

async function deployContracts() {
	console.log('\n------------------------------------------');
	console.log(`DEPLOYING CONTRACTS to ${network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	let mockLink;
	let mockDai;
	let mockDaiBlacklisted;
	if (network.name === 'docker' || network.name === 'localhost') {
		console.log('Deploying MockLink...');
		const MockLink = await ethers.getContractFactory('MockLink');
		mockLink = await MockLink.deploy();
		await mockLink.deployed();
		await optionalSleep(10000);
		console.log(`MockLink Deployed to ${mockLink.address}\n`);

		console.log('Deploying MockDai...');
		const MockDai = await ethers.getContractFactory('MockDai');
		mockDai = await MockDai.deploy();
		await mockDai.deployed();
		await optionalSleep(10000);
		console.log(`MockDai Deployed to ${mockDai.address}\n`);

		console.log('Deploying MockDai (Blacklisted)...');
		const MockDaiBlacklisted = await ethers.getContractFactory('MockDai');
		mockDaiBlacklisted = await MockDaiBlacklisted.deploy();
		await mockDaiBlacklisted.deployed();
		await optionalSleep(10000);
		console.log(`MockDai (Blacklisted) Deployed to ${mockDaiBlacklisted.address}\n`);
	}

	console.log('Deploying OpenQV0 (Implementation)...');
	const OpenQImplementation = await ethers.getContractFactory('OpenQV0');
	const openQImplementation = await OpenQImplementation.deploy();
	await openQImplementation.deployed();
	console.log(`OpenQV0 (Implementation) Deployed to ${openQImplementation.address}\n`);

	console.log('Deploying OpenQV1 (Implementation)...');
	const OpenQImplementationV1 = await ethers.getContractFactory('OpenQV1');
	const openQImplementationV1 = await OpenQImplementationV1.deploy();
	await openQImplementationV1.deployed();
	console.log(`OpenQV1 (Implementation) Deployed to ${openQImplementationV1.address}\n`);

	console.log('Deploying OpenQProxy...');
	const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
	let openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
	const confirmation = await openQProxy.deployed();
	const deployBlockNumber = parseInt(confirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`OpenQV0 (Proxy) Deployed to ${openQProxy.address} in block number ${deployBlockNumber}\n`);

	// Attach the OpenQV0 ABI to the OpenQProxy address to send method calls to the delegatecall
	openQProxy = await OpenQImplementation.attach(openQProxy.address);

	await openQProxy.initialize(process.env.ORACLE_ADDRESS);

	console.log('Deploying OpenQTokenWhitelist...');
	const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
	const openQTokenWhitelist = await OpenQTokenWhitelist.deploy(1);
	await openQTokenWhitelist.deployed();
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist Deployed to ${openQTokenWhitelist.address}\n`);

	console.log('Deploying BountyV0...');
	const BountyV0 = await ethers.getContractFactory('BountyV0');
	const bountyV0 = await BountyV0.deploy();
	await bountyV0.deployed();
	await optionalSleep(10000);
	console.log(`BountyV0 Deployed to ${bountyV0.address}\n`);

	console.log('Deploying BountyV1...');
	const BountyV1 = await ethers.getContractFactory('BountyV1');
	const bountyV1 = await BountyV1.deploy();
	await bountyV1.deployed();
	await optionalSleep(10000);
	console.log(`BountyV1 Deployed to ${bountyV1.address}\n`);

	console.log('Deploying BountyBeacon...');
	const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
	const bountyBeacon = await BountyBeacon.deploy(bountyV0.address);
	await bountyBeacon.deployed();
	await optionalSleep(10000);
	console.log(`BountyBeacon Deployed to ${bountyBeacon.address}\n`);

	console.log('Deploying BountyFactory...');
	const BountyFactory = await ethers.getContractFactory('BountyFactory');
	const bountyFactory = await BountyFactory.deploy(openQProxy.address, bountyBeacon.address);
	await bountyFactory.deployed();
	await optionalSleep(10000);
	console.log(`BountyFactory Deployed to ${bountyFactory.address}\n`);

	console.log('OPENQ ADDRESSES');
	console.log(`OpenQV0 (Proxy) deployed to: ${openQProxy.address}`);
	console.log(`OpenQV0 (Implementation) deployed to: ${openQImplementation.address}`);
	console.log(`OpenQV1 (Implementation) deployed to: ${openQImplementationV1.address}`);

	console.log('\nBOUNTY ADDRESSES');
	console.log(`BountyV0 (Implementation) deployed to ${bountyV0.address}`);
	console.log(`BountyV1 (Implementation) deployed to ${bountyV1.address}\n`);
	console.log(`BountyBeacon deployed to ${bountyBeacon.address}`);
	console.log(`BountyFactory deployed to: ${bountyFactory.address}`);

	if (network.name === 'docker' || network.name === 'localhost') {
		console.log(`MockLink deployed to: ${mockLink.address}`);
		console.log(`MockDai deployed to: ${mockDai.address}`);
		console.log(`MockDai (BlackListed) deployed to: ${mockDaiBlacklisted.address}`);
	}

	console.log('\nConfiguring OpenQV0 with BountyFactory...');
	console.log(`Setting BountyFactory on OpenQV0 to ${bountyFactory.address}...`);
	await openQProxy.setBountyFactory(bountyFactory.address);
	await optionalSleep(10000);
	console.log(`BountyFactory successfully set on OpenQV0 to ${bountyFactory.address}`);

	console.log('\nConfiguring OpenQV0 with OpenQTokenWhitelist...');
	console.log(`Setting OpenQTokenWhitelist on OpenQV0 to ${openQTokenWhitelist.address}...`);
	await openQProxy.setTokenWhitelist(openQTokenWhitelist.address);
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist successfully set on OpenQV0 to ${openQTokenWhitelist.address}`);

	console.log('\nContracts deployed and configured successfully!');

	/* Write newly deployed contract addresses to .env.contracts for use in:
		 - docker-compose environment
		 - other hardhat scripts
	*/
	let addresses;
	if (network.name === 'docker' || network.name === 'localhost') {
		addresses = `OPENQ_PROXY_ADDRESS="${openQProxy.address}"
OPENQ_IMPLEMENTATION_ADDRESS="${openQImplementation.address}"
OPENQ_BOUNTY_FACTORY_ADDRESS="${bountyFactory.address}"
BOUNTY_BEACON_ADDRESS="${bountyBeacon.address}"
OPENQ_BOUNTY_IMPLEMENTATION_ADDRESS="${bountyV0.address}"
OPENQ_BOUNTY_IMPLEMENTATION_V1_ADDRESS="${bountyV1.address}"
OPENQ_TOKEN_WHITELIST_ADDRESS="${openQTokenWhitelist.address}"
OPENQ_DEPLOY_BLOCK_NUMBER="${deployBlockNumber}"
MOCK_LINK_TOKEN_ADDRESS="${mockLink.address}"
MOCK_DAI_TOKEN_ADDRESS="${mockDai.address}"
MOCK_DAI_BLACKLISTED_TOKEN_ADDRESS="${mockDaiBlacklisted.address}"
`;
	} else {
		addresses = `OPENQ_PROXY_ADDRESS="${openQProxy.address}"
OPENQ_IMPLEMENTATION_ADDRESS="${openQImplementation.address}"
OPENQ_IMPLEMENTATION_ADDRESS_V1="${openQImplementationV1.address}"
OPENQ_BOUNTY_FACTORY_ADDRESS="${bountyFactory.address}"
BOUNTY_BEACON_ADDRESS="${bountyBeacon.address}"
OPENQ_BOUNTY_IMPLEMENTATION_ADDRESS="${bountyV0.address}"
OPENQ_BOUNTY_IMPLEMENTATION_V1_ADDRESS="${bountyV1.address}"
OPENQ_TOKEN_WHITELIST_ADDRESS="${openQTokenWhitelist.address}"
OPENQ_DEPLOY_BLOCK_NUMBER="${deployBlockNumber}"
MOCK_LINK_TOKEN_ADDRESS="0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
MOCK_DAI_TOKEN_ADDRESS="0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1"
MOCK_DAI_TOKEN_ADDRESS="0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1"
`;
	}


	fs.writeFileSync('.env.contracts', addresses);
}

async function main() {
	await deployContracts();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = deployContracts;