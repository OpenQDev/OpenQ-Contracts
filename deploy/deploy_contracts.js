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

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ MAIN CONTRACT');
	console.log('------------------------------------------');

	console.log('Deploying OpenQV1 (Implementation)...');
	const OpenQImplementationV1 = await ethers.getContractFactory('OpenQV1');
	const openQImplementationV1 = await OpenQImplementationV1.deploy();
	await openQImplementationV1.deployed();
	console.log(`OpenQV1 (Implementation) Deployed to ${openQImplementationV1.address}\n`);

	console.log('Deploying OpenQProxy...');
	const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
	let openQProxy = await OpenQProxy.deploy(openQImplementationV1.address, []);
	const confirmation = await openQProxy.deployed();
	const deployBlockNumber = parseInt(confirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`OpenQV1 (Proxy) Deployed to ${openQProxy.address} in block number ${deployBlockNumber}\n`);

	// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
	openQProxy = await OpenQImplementationV1.attach(openQProxy.address);

	await openQProxy.initialize();

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ CLAIM MANAGER');
	console.log('------------------------------------------');

	console.log('Deploying Claim Manager Implementation...');
	const ClaimManager = await ethers.getContractFactory('ClaimManager');
	let claimManager = await ClaimManager.deploy();
	const claimManagerConfirmation = await claimManager.deployed();
	const deployBlockNumber_claimManager = parseInt(claimManagerConfirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`Claim Manager Implementation Deployed to ${claimManager.address} in block number ${deployBlockNumber_claimManager}\n`);

	console.log('Deploying Claim Manager Proxy...');
	const ClaimManagerProxy = await ethers.getContractFactory('OpenQProxy');
	let claimManagerProxy = await ClaimManagerProxy.deploy(claimManager.address, []);
	const claimManagerProxyConfirmation = await claimManagerProxy.deployed();
	const deployBlockNumber_claimManagerProxy = parseInt(claimManagerProxyConfirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`Claim Manager Proxy Deployed to ${claimManagerProxy.address} in block number ${deployBlockNumber_claimManagerProxy}\n`);

	// Attach the DepositManager ABI to the OpenQProxy address to send method calls to the delegatecall
	claimManagerProxy = await ClaimManager.attach(claimManager.address);

	await claimManagerProxy.initialize(process.env.ORACLE_ADDRESS);

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ DEPOSIT MANAGER');
	console.log('------------------------------------------');

	console.log('Deploying Deposit Manager Implementation...');
	const DepositManager = await ethers.getContractFactory('DepositManager');
	let depositManager = await DepositManager.deploy();
	const depositManagerConfirmation = await depositManager.deployed();
	const deployBlockNumber_depositManager = parseInt(depositManagerConfirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`Deposit Manager Implementation Deployed to ${depositManager.address} in block number ${deployBlockNumber_depositManager}\n`);

	console.log('Deploying Deposit Manager Proxy...');
	const DepositManagerProxy = await ethers.getContractFactory('OpenQProxy');
	let depositManagerProxy = await DepositManagerProxy.deploy(depositManager.address, []);
	const depositManagerProxyConfirmation = await depositManagerProxy.deployed();
	const deployBlockNumber_depositManagerProxy = parseInt(depositManagerProxyConfirmation.provider._fastBlockNumber);
	await optionalSleep(10000);
	console.log(`Deposit Manager Proxy Deployed to ${depositManagerProxy.address} in block number ${deployBlockNumber_depositManagerProxy}\n`);

	// Attach the ClaimManager ABI to the OpenQProxy address to send method calls to the delegatecall
	depositManagerProxy = await DepositManager.attach(depositManager.address);

	await depositManagerProxy.initialize();

	console.log('Deploying OpenQTokenWhitelist...');
	const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
	const openQTokenWhitelist = await OpenQTokenWhitelist.deploy(1);
	await openQTokenWhitelist.deployed();
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist Deployed to ${openQTokenWhitelist.address}\n`);

	console.log('\nConfiguring OpenQV1 with OpenQTokenWhitelist...');
	console.log(`Setting OpenQTokenWhitelist on OpenQV1 to ${openQTokenWhitelist.address}...`);
	await depositManagerProxy.setTokenWhitelist(openQTokenWhitelist.address);
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist successfully set on DepositManager to ${openQTokenWhitelist.address}`);

	console.log('Deploying BountyV1...');
	const BountyV1 = await ethers.getContractFactory('BountyV1');
	const bountyV1 = await BountyV1.deploy();
	await bountyV1.deployed();
	await optionalSleep(10000);
	console.log(`BountyV1 Deployed to ${bountyV1.address}\n`);

	console.log('Deploying BountyBeacon...');
	const BountyBeacon = await ethers.getContractFactory('BountyBeacon');
	const bountyBeacon = await BountyBeacon.deploy(bountyV1.address);
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
	console.log(`OpenQV1 (Proxy) deployed to: ${openQProxy.address}`);
	console.log(`OpenQV1 (Implementation) deployed to: ${openQImplementationV1.address}`);

	console.log('\nBOUNTY ADDRESSES');
	console.log(`BountyV1 (Implementation) deployed to ${bountyV1.address}\n`);
	console.log(`BountyBeacon deployed to ${bountyBeacon.address}`);
	console.log(`BountyFactory deployed to: ${bountyFactory.address}`);

	if (network.name === 'docker' || network.name === 'localhost') {
		console.log(`MockLink deployed to: ${mockLink.address}`);
		console.log(`MockDai deployed to: ${mockDai.address}`);
		console.log(`MockDai (BlackListed) deployed to: ${mockDaiBlacklisted.address}`);
	}

	console.log('\nConfiguring OpenQV1 with BountyFactory...');
	console.log(`Setting BountyFactory on OpenQV1 to ${bountyFactory.address}...`);
	await openQProxy.setBountyFactory(bountyFactory.address);
	await optionalSleep(10000);
	console.log(`BountyFactory successfully set on OpenQV1 to ${bountyFactory.address}`);

	console.log('\nContracts deployed and configured successfully!');

	/* Write newly deployed contract addresses to .env.contracts for use in:
		 - docker-compose environment
		 - other hardhat scripts
	*/
	let addresses;
	if (network.name === 'docker' || network.name === 'localhost') {
		addresses = `OPENQ_PROXY_ADDRESS="${openQProxy.address}"
OPENQ_IMPLEMENTATION_ADDRESS="${openQImplementationV1.address}"
CLAIM_MANAGER_PROXY_ADDRESS="${claimManagerProxy.address}"
DEPOSIT_MANAGER_PROXY_ADDRESS="${depositManagerProxy.address}"
OPENQ_BOUNTY_FACTORY_ADDRESS="${bountyFactory.address}"
BOUNTY_BEACON_ADDRESS="${bountyBeacon.address}"
OPENQ_BOUNTY_IMPLEMENTATION_ADDRESS="${bountyV1.address}"
OPENQ_TOKEN_WHITELIST_ADDRESS="${openQTokenWhitelist.address}"
OPENQ_DEPLOY_BLOCK_NUMBER="${deployBlockNumber}"
MOCK_LINK_TOKEN_ADDRESS="${mockLink.address}"
MOCK_DAI_TOKEN_ADDRESS="${mockDai.address}"
MOCK_DAI_BLACKLISTED_TOKEN_ADDRESS="${mockDaiBlacklisted.address}"
`;
	} else {
		addresses = `OPENQ_PROXY_ADDRESS="${openQProxy.address}"
OPENQ_IMPLEMENTATION_ADDRESS="${openQImplementationV1.address}"
OPENQ_BOUNTY_FACTORY_ADDRESS="${bountyFactory.address}"
BOUNTY_BEACON_ADDRESS="${bountyBeacon.address}"
OPENQ_BOUNTY_IMPLEMENTATION_ADDRESS="${bountyV1.address}"
OPENQ_TOKEN_WHITELIST_ADDRESS="${openQTokenWhitelist.address}"
OPENQ_DEPLOY_BLOCK_NUMBER="${deployBlockNumber}"
MOCK_LINK_TOKEN_ADDRESS="0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
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