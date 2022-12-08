const { ethers } = require('hardhat');
const { optionalSleep } = require('./utils');
const path = require('path');
const { openQIssueIds, otherOrgIssueIds } = require('./gitHubIssueIds.json');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.contracts') });

async function fundBounties() {
	console.log('\n------------------------------------------');
	console.log('FUNDING BOUNTIES with MOCK LINK and DUMMY ERC20 AND FUNDING ACCOUNTS WITH NFTS');
	console.log('------------------------------------------');

	// PREPARE ASSETS
	const MockLink = await ethers.getContractFactory('MockLink');
	const mockLink = await MockLink.attach(process.env.MOCK_LINK_TOKEN_ADDRESS);

	const MockDai = await ethers.getContractFactory('MockDai');
	const mockDai = await MockDai.attach(process.env.MOCK_DAI_TOKEN_ADDRESS);

	const MockNFT = await ethers.getContractFactory('MockNft');
	const mockNFT = await MockNFT.attach(process.env.MOCK_NFT_TOKEN_ADDRESS);

	const OpenQ = await ethers.getContractFactory('OpenQV3');
	const openQ = await OpenQ.attach(process.env.OPENQ_PROXY_ADDRESS);

	const DepositManager = await ethers.getContractFactory('DepositManager');
	const depositManager = await DepositManager.attach(process.env.DEPOSIT_MANAGER_PROXY_ADDRESS);

	const one = ethers.BigNumber.from('1000000000000000000');
	const two = ethers.BigNumber.from('2000000000000000000');
	const three = ethers.BigNumber.from('3000000000000000000');
	const four = ethers.BigNumber.from('4000000000000000000');
	const eight = ethers.BigNumber.from('8000000000000000000');

	// GET CONTRACT ADDRESSES
	const openQBounty1Address = await openQ.bountyIdToAddress(openQIssueIds[0]);
	const openQBounty2Address = await openQ.bountyIdToAddress(openQIssueIds[1]);
	const openQBounty3Address = await openQ.bountyIdToAddress(openQIssueIds[2]);
	const openQBounty4Address = await openQ.bountyIdToAddress(openQIssueIds[3]);
	const openQBounty5Address = await openQ.bountyIdToAddress(openQIssueIds[4]);
	const openQBounty6Address = await openQ.bountyIdToAddress(openQIssueIds[5]);
	const openQBounty7Address = await openQ.bountyIdToAddress(openQIssueIds[6]);

	const otherOrgBounty1Address = await openQ.bountyIdToAddress(otherOrgIssueIds[0]);
	const otherOrgBounty2Address = await openQ.bountyIdToAddress(otherOrgIssueIds[1]);
	const otherOrgBounty3Address = await openQ.bountyIdToAddress(otherOrgIssueIds[2]);
	const otherOrgBounty4Address = await openQ.bountyIdToAddress(otherOrgIssueIds[3]);
	const otherOrgBounty5Address = await openQ.bountyIdToAddress(otherOrgIssueIds[4]);
	const otherOrgBounty6Address = await openQ.bountyIdToAddress(otherOrgIssueIds[5]);
	const otherOrgBounty7Address = await openQ.bountyIdToAddress(otherOrgIssueIds[6]);

	// APPROVE ERC20 FOR CLIENT1
	await mockLink.approve(openQBounty1Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(openQBounty1Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(openQBounty5Address, eight);
	await optionalSleep(5000);

	await mockLink.approve(openQBounty2Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(openQBounty2Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(openQBounty6Address, eight);
	await optionalSleep(5000);

	await mockLink.approve(openQBounty3Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(openQBounty3Address, eight);
	await optionalSleep(5000);

	await mockLink.approve(otherOrgBounty3Address, eight);
	await optionalSleep(5000);

	await mockDai.approve(otherOrgBounty3Address, eight);
	await optionalSleep(5000);

	const thirtySeconds = 30;
	const fifteenDays = 1296000;
	const thirtyDays = 2592000;

	console.log('Funding approved for Client 1!');

	await optionalSleep(5000);

	console.log('Funding contracts for Client 1...');
	await depositManager.fundBountyToken(openQBounty1Address, mockLink.address, one, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty1Address, mockLink.address, one, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty1Address, mockLink.address, one, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty1Address, mockLink.address, one, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty6Address, mockDai.address, one, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty1Address, mockLink.address, one, thirtyDays);
	await depositManager.fundBountyToken(openQBounty1Address, mockDai.address, two, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty2Address, mockLink.address, one, fifteenDays);
	await depositManager.fundBountyToken(openQBounty2Address, mockDai.address, two, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty5Address, mockDai.address, two, thirtySeconds);
	await depositManager.fundBountyToken(openQBounty2Address, ethers.constants.AddressZero, one, fifteenDays, { value: one });
	await depositManager.fundBountyToken(openQBounty3Address, ethers.constants.AddressZero, one, thirtySeconds, { value: one });
	await depositManager.fundBountyToken(openQBounty3Address, ethers.constants.AddressZero, one, thirtySeconds, { value: one });
	await depositManager.fundBountyToken(openQBounty3Address, mockDai.address, two, fifteenDays);
	await depositManager.fundBountyToken(openQBounty3Address, mockLink.address, two, thirtySeconds);
	await depositManager.fundBountyToken(otherOrgBounty3Address, mockDai.address, two, fifteenDays);
	await depositManager.fundBountyToken(otherOrgBounty3Address, mockLink.address, two, thirtySeconds);
	console.log('Funding succeeded for Client 1!');

	// FUND WITH CLIENT 2
	const [, contributor] = await ethers.getSigners();

	console.log('Transferring LINK and DERC20 to Client 2');
	await mockDai.transfer(contributor.address, two);
	await mockLink.transfer(contributor.address, two);
	console.log('Transfer to Client 2 succeeded');
	await mockNFT.safeMint(contributor.address);
	await mockNFT.safeMint(contributor.address);
	await mockNFT.safeMint(contributor.address);
	await mockNFT.safeMint(contributor.address);
	await mockNFT.safeMint(contributor.address);
	await mockNFT.safeMint(contributor.address);

	console.log('Approving funds for Client 2...');
	await mockLink.connect(contributor).approve(openQBounty1Address, one);
	await mockDai.connect(contributor).approve(openQBounty1Address, two);
	await mockLink.connect(contributor).approve(otherOrgBounty2Address, one);
	await mockDai.connect(contributor).approve(otherOrgBounty2Address, two);
	console.log('Funding approved for Client 2!');

	console.log('Funding contracts for Client 2...');
	await depositManager.connect(contributor).fundBountyToken(openQBounty1Address, mockLink.address, one, thirtyDays);
	await depositManager.connect(contributor).fundBountyToken(openQBounty1Address, mockDai.address, one, thirtySeconds);
	await depositManager.connect(contributor).fundBountyToken(otherOrgBounty2Address, mockLink.address, one, fifteenDays);
	await depositManager.connect(contributor).fundBountyToken(otherOrgBounty2Address, mockDai.address, one, thirtyDays);
	console.log('Funding succeeded for Client 2!');

	console.log('\nBounties funded successfully!\n');
}

async function main() {
	await fundBounties();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = fundBounties;