const deployContracts = require('./deploy_contracts');
const deployBounties = require('./deploy_bounties');
const fundBounties = require('./fund_bounties');

async function main() {
	// await deployContracts();
	await deployBounties();
	// await fundBounties();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
