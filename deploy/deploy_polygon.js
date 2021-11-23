const hre = require('hardhat');
const fs = require('fs');

async function main() {
	async function sleep(time) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, time);
		});
	}

	const MockToken = await hre.ethers.getContractFactory('MockToken');
	const mockToken = await MockToken.deploy();
	await mockToken.deployed();
	await sleep(10000);

	const FakeToken = await hre.ethers.getContractFactory('FakeToken');
	const fakeToken = await FakeToken.deploy();
	await fakeToken.deployed();
	await sleep(10000);

	const OpenQ = await hre.ethers.getContractFactory('OpenQ');
	const openQ = await OpenQ.deploy();
	await openQ.deployed();
	await sleep(10000);

	console.log('MockToken deployed to:', mockToken.address);
	console.log('FakeToken deployed to:', fakeToken.address);
	console.log('OpenQ deployed to:', openQ.address);

	const githubIssueIds = ['I_kwDOGWnnz84-qyDq'];

	await openQ.mintBounty(githubIssueIds[0]);

	const bounty1Address = await openQ.getBountyAddress(githubIssueIds[0]);

	console.log(`Bounty 1 with id ${githubIssueIds[0]} minted to ${bounty1Address}`);

	await fakeToken.transfer(bounty1Address, 1000000);
	await sleep(10000);
	await mockToken.transfer(bounty1Address, 2500000);
	await sleep(10000);

	const addresses = `OPENQ_ADDRESS="${openQ.address}"
FAKE_TOKEN_ADDRESS="${fakeToken.address}"
MOCK_TOKEN_ADDRESS="${mockToken.address}"`;

	fs.writeFileSync('.env.contracts', addresses);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
