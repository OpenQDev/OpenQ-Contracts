const { ethers, web3 } = require('hardhat');

const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');

const { Framework } = require('@superfluid-finance/sdk-core');

const fs = require('fs');
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

	const FDai = await ethers.getContractFactory('TestToken');
	const fDai = await FDai.attach(fDAIAddress);
	const thousand = ethers.BigNumber.from('1000000000000000000000');
	await fDai.mint(accounts[0].address, thousand);
	await fDai.approve(fDAIxAddress, thousand);

	//////////////// UPGRADE //////////////////////
	let sf = await Framework.create({
		chainId: 31337,
		provider: web3,
		resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
		protocolReleaseVersion: 'test',
	});

	let superSigner = await sf.createSigner({
		signer: accounts[0],
		provider: web3
	});

	const superToken = await sf.loadSuperToken(fDAIxAddress);

	let amount = 500;

	let parsedAmount = ethers.utils.parseEther(amount.toString());

	const ret = await superToken.upgrade({
		amount: parsedAmount.toString(),
	}).exec(superSigner);

	console.log(ret);

	const addresses = `FDAI_ADDRESS=${fDAIAddress}
FDAIX_ADDRESS=${fDAIxAddress}
SUPERFLUID_RESOLVER_ADDRESS=${process.env.RESOLVER_ADDRESS}
`;

	fs.writeFileSync('.env.superfluid.contracts', addresses);
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
