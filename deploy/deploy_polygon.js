const hre = require('hardhat');
const fs = require('fs');
const ethers = require('ethers');

async function main() {
	// DEPLOY CONTRACTS
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

	// MINT BOUNTIES AND GET ADDRESSES
	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGAqhQc48U54v', 'I_kwDOGAqhQc48U5_r', 'I_kwDOGWnnz84-qyDq'];

	await openQ.mintBounty(githubIssueIds[0], 'openqdev');
	await sleep(5000);

	await openQ.mintBounty(githubIssueIds[1], 'openqdev');
	await sleep(5000);

	await openQ.mintBounty(githubIssueIds[2], 'openqdev');
	await sleep(5000);

	await openQ.mintBounty(githubIssueIds[3], 'openqdev');
	await sleep(5000);

	const bounty1Address = await openQ.getBountyAddress(githubIssueIds[0]);
	const bounty2Address = await openQ.getBountyAddress(githubIssueIds[1]);
	const bounty3Address = await openQ.getBountyAddress(githubIssueIds[2]);
	const bounty4Address = await openQ.getBountyAddress(githubIssueIds[3]);

	console.log(`Bounty 1 with id ${githubIssueIds[0]} minted to ${bounty1Address}`);
	console.log(`Bounty 2 with id ${githubIssueIds[1]} minted to ${bounty2Address}`);
	console.log(`Bounty 3 with id ${githubIssueIds[2]} minted to ${bounty3Address}`);
	console.log(`Bounty 4 with id ${githubIssueIds[3]} minted to ${bounty4Address}`);

	// FUND BOUNTIES
	const one = ethers.BigNumber.from('1000000000000000000');
	const two = ethers.BigNumber.from('2000000000000000000');

	await mockToken.approve(bounty1Address, one);
	await sleep(5000);

	await fakeToken.approve(bounty1Address, two);
	await sleep(5000);

	await mockToken.approve(bounty2Address, one);
	await sleep(5000);

	await fakeToken.approve(bounty2Address, two);
	await sleep(5000);

	console.log('Approved funding');

	await openQ.fundBounty(bounty1Address, mockToken.address, one);
	await sleep(5000);

	await openQ.fundBounty(bounty1Address, fakeToken.address, two);
	await sleep(5000);

	await openQ.fundBounty(bounty2Address, mockToken.address, one);
	await sleep(5000);

	await openQ.fundBounty(bounty2Address, fakeToken.address, two);
	await sleep(5000);

	const addresses = `OPENQ_ADDRESS="${openQ.address}"
FAKE_TOKEN_ADDRESS="${fakeToken.address}"
MOCK_TOKEN_ADDRESS="${mockToken.address}"`;

	fs.writeFileSync('.env.contracts', addresses);

	async function sleep(time) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, time);
		});
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
