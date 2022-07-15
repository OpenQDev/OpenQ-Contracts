const { ethers, web3 } = require('hardhat');

const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

const errorHandler = (err) => {
	if (err) throw err;
};

async function deploySuperfluid() {
	//get accounts from hardhat
	const accounts = await ethers.getSigners();

	//deploy the framework
	await deployFramework(errorHandler, {
		web3,
		from: accounts[0].address,
	});

	//deploy a fake erc20 token
	let fDAIAddress = await deployTestToken(errorHandler, [':', 'fDAI'], {
		web3,
		from: accounts[0].address,
	});
	//deploy a fake erc20 wrapper super token around the fDAI token
	let fDAIxAddress = await deploySuperToken(errorHandler, [':', 'fDAI'], {
		web3,
		from: accounts[0].address,
	});

	console.log('fDAIAddress', fDAIAddress);
	console.log('fDAIxAddress', fDAIxAddress);
}

async function main() {
	await deploySuperfluid();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = deploySuperfluid;