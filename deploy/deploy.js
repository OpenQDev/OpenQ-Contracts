const hre = require('hardhat');
const fs = require('fs');

async function main() {
	const MockToken = await hre.ethers.getContractFactory('MockToken');
	const mockToken = await MockToken.deploy();
	await mockToken.deployed();

	const FakeToken = await hre.ethers.getContractFactory('FakeToken');
	const fakeToken = await FakeToken.deploy();
	await fakeToken.deployed();

	const OpenQ = await hre.ethers.getContractFactory('OpenQ');
	const openQ = await OpenQ.deploy();
	await openQ.deployed();

	await openQ.addTokenAddress(mockToken.address);
	await openQ.addTokenAddress(fakeToken.address);

	console.log('MockToken deployed to:', mockToken.address);
	console.log('FakeToken deployed to:', fakeToken.address);
	console.log('OpenQ deployed to:', openQ.address);

	const githubIssueIds = ['I_kwDOE5zs-M480ik8', 'I_kwDOGAqhQc48U54v', 'I_kwDOGAqhQc48U5_r'];

	await openQ.mintBounty(githubIssueIds[0]);
	await openQ.mintBounty(githubIssueIds[1]);
	await openQ.mintBounty(githubIssueIds[2]);

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

	console.log(`Bounty 1 with id ${githubIssueIds[0]} minted to ${bounty1Address}`);
	console.log(`Bounty 2 with id ${githubIssueIds[1]} minted to ${bounty2Address}`);
	console.log(`Bounty 3 with id ${githubIssueIds[2]} minted to ${bounty3Address}`);

	await fakeToken.transfer(bounty1Address, 1000000);
	await mockToken.transfer(bounty1Address, 2500000);

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
