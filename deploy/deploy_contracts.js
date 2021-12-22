const hre = require('hardhat');
const fs = require('fs');
const { optionalSleep } = require('./utils');

async function deployContracts() {
	const MockLink = await hre.ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.deploy();
	await mockLink.deployed();
	await optionalSleep(10000);

	const MockDai = await hre.ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.deploy();
	await mockDai.deployed();
	await optionalSleep(10000);

	const OpenQ = await hre.ethers.getContractFactory('OpenQV1');
	const openQ = await OpenQ.deploy();
	await openQ.deployed();
	await optionalSleep(10000);

	console.log('MockLink deployed to:', mockLink.address);
	console.log('MockDai deployed to:', mockDai.address);
	console.log('OpenQV1 deployed to:', openQ.address);

	// Write contract addresses to .env.contracts file for use in OpenQ-Frontend and OpenQ-Oracle
	const addresses = `OPENQ_ADDRESS="${openQ.address}"
MOCK_DAI_TOKEN_ADDRESS="${mockDai.address}"
MOCK_LINK_TOKEN_ADDRESS="${mockLink.address}"`;

	fs.writeFileSync('.env.contracts', addresses);
}

module.exports = deployContracts;