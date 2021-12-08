const hre = require('hardhat');
const fs = require('fs');
const ethers = require('ethers');

async function main() {
	// DEPLOY CONTRACTS
	const MockLink = await hre.ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.deploy();
	await mockLink.deployed();
	await sleep(10000);

	const MockDai = await hre.ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.deploy();
	await mockDai.deployed();
	await sleep(10000);

	const OpenQ = await hre.ethers.getContractFactory('OpenQ');
	const openQ = await OpenQ.deploy();
	await openQ.deployed();
	await sleep(10000);

	console.log('MockLink deployed to:', mockLink.address);
	console.log('MockDai deployed to:', mockDai.address);
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

	await mockLink.approve(bounty1Address, one);
	await sleep(5000);

	await mockDai.approve(bounty1Address, two);
	await sleep(5000);

	await mockLink.approve(bounty2Address, one);
	await sleep(5000);

	await mockDai.approve(bounty2Address, two);
	await sleep(5000);

	console.log('Approved funding');

	await openQ.fundBounty(bounty1Address, mockLink.address, one);
	await sleep(5000);

	await openQ.fundBounty(bounty1Address, mockDai.address, two);
	await sleep(5000);

	await openQ.fundBounty(bounty2Address, mockLink.address, one);
	await sleep(5000);

	await openQ.fundBounty(bounty2Address, mockDai.address, two);
	await sleep(5000);

	const addresses = `OPENQ_ADDRESS="${openQ.address}"
MOCK_DAI_TOKEN_ADDRESS="${mockDai.address}"
MOCK_LINK_TOKEN_ADDRESS="${mockLink.address}"`;

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
