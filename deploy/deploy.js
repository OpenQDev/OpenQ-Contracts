const hre = require('hardhat');
const fs = require('fs');
const ethers = require('ethers');

async function main() {
	const MockLink = await hre.ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.deploy();
	await mockLink.deployed();

	const MockDai = await hre.ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.deploy();
	await mockDai.deployed();

	const OpenQ = await hre.ethers.getContractFactory('OpenQ');
	const openQ = await OpenQ.deploy();
	await openQ.deployed();

	console.log('MockLink deployed to:', mockLink.address);
	console.log('MockDai deployed to:', mockDai.address);
	console.log('OpenQ deployed to:', openQ.address);

	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGAqhQc48U54v', 'I_kwDOGAqhQc48U5_r', 'I_kwDOGWnnz84-qyDq'];

	await openQ.mintBounty(githubIssueIds[0], 'openqdev');
	await openQ.mintBounty(githubIssueIds[1], 'openqdev');
	await openQ.mintBounty(githubIssueIds[2], 'openqdev');
	await openQ.mintBounty(githubIssueIds[3], 'openqdev');

	// must wait 3.5 seconds or so for propogation on Mumbai
	if (process.env.DEPLOY_ENV == 'mumbai') {
		async function sleep(time) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve();
				}, time);
			});
		}

		await sleep(3500);
	}

	const bounty1Address = await openQ.getBountyAddress(githubIssueIds[0]);
	const bounty2Address = await openQ.getBountyAddress(githubIssueIds[1]);
	const bounty3Address = await openQ.getBountyAddress(githubIssueIds[2]);
	const bounty4Address = await openQ.getBountyAddress(githubIssueIds[3]);

	console.log(`Bounty 1 with id ${githubIssueIds[0]} minted to ${bounty1Address}`);
	console.log(`Bounty 2 with id ${githubIssueIds[1]} minted to ${bounty2Address}`);
	console.log(`Bounty 3 with id ${githubIssueIds[2]} minted to ${bounty3Address}`);
	console.log(`Bounty 4 with id ${githubIssueIds[3]} minted to ${bounty4Address}`);

	// Pre-load with some deposits
	const one = ethers.BigNumber.from('1000000000000000000');
	const two = ethers.BigNumber.from('2000000000000000000');
	const four = ethers.BigNumber.from('4000000000000000000');

	await mockLink.approve(bounty1Address, one);
	await mockDai.approve(bounty1Address, two);

	await mockLink.approve(bounty2Address, one);
	await mockDai.approve(bounty2Address, two);

	await openQ.fundBounty(bounty1Address, mockLink.address, one);
	await openQ.fundBounty(bounty1Address, mockDai.address, two);

	await openQ.fundBounty(bounty2Address, mockLink.address, one);
	await openQ.fundBounty(bounty2Address, mockDai.address, two);

	// Contributor 2
	const [, contributor] = await hre.ethers.getSigners();
	await mockDai.transfer(contributor.address, four);
	await mockLink.transfer(contributor.address, four);

	await mockLink.connect(contributor);
	await mockDai.connect(contributor);
	await openQ.connect(contributor);

	await mockLink.connect(contributor).approve(bounty1Address, one);
	await mockDai.connect(contributor).approve(bounty1Address, two);

	await mockLink.connect(contributor).approve(bounty2Address, one);
	await mockDai.connect(contributor).approve(bounty2Address, two);

	await openQ.connect(contributor).fundBounty(bounty1Address, mockLink.address, one);
	await openQ.connect(contributor).fundBounty(bounty1Address, mockDai.address, two);

	await openQ.connect(contributor).fundBounty(bounty2Address, mockLink.address, one);
	await openQ.connect(contributor).fundBounty(bounty2Address, mockDai.address, two);

	// Write contract addresses to .env.contracts file for use in OpenQ-Frontend and OpenQ-Oracle
	const addresses = `OPENQ_ADDRESS="${openQ.address}"
MOCK_DAI_TOKEN_ADDRESS="${mockDai.address}"
MOCK_LINK_TOKEN_ADDRESS="${mockLink.address}"`;

	fs.writeFileSync('.env.contracts', addresses);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
