const deployContracts = require('./deploy_contracts');
const deployBounties = require('./deploy_bounties');
const fundBounties = require('./fund_bounties');
const verifyContracts = require('./verify_contracts');

async function main() {
	await deployContracts();
	await configureTokenWhitelist();
	await verifyContracts();
	await deployBounties();
	await fundBounties();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
