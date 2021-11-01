const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { bigNumberToEtherFloat } = require('./utils');

describe('OpenQ contract', () => {
	const issueStatusEnum = ['OPEN', 'CLAIMED'];

	it('depositEthForIssue should associate issueId to amount on msg.value', async () => {
		// Instantiate contract and set up
		const UserAddressStorage = await ethers.getContractFactory('UserAddressStorage');
		const userAddressStorage = await UserAddressStorage.deploy();

		const DepositStorage = await ethers.getContractFactory('DepositStorage');
		const depositStorage = await DepositStorage.deploy();

		const OpenQ = await ethers.getContractFactory('OpenQ');
		const openQ = await OpenQ.deploy(userAddressStorage.address, depositStorage.address);

		await depositStorage.setOpenQ(openQ.address);
		await userAddressStorage.setOpenQ(openQ.address);

		const mockIssueId = 'mockIssueId';

		let overrides = {
			value: ethers.utils.parseEther('1.0')
		};

		await openQ.depositEthForIssue('mockIssueId', overrides);

		const depositAmount = await depositStorage.issueDepositsAmountByIssueId(mockIssueId);

		expect(ethers.utils.formatEther(depositAmount)).to.equal('1.0');
	});

	it('should register user', async () => {
		const UserAddressStorage = await ethers.getContractFactory('UserAddressStorage');
		const userAddressStorage = await UserAddressStorage.deploy();

		const DepositStorage = await ethers.getContractFactory('DepositStorage');
		const depositStorage = await DepositStorage.deploy();

		const OpenQ = await ethers.getContractFactory('OpenQ');
		const openQ = await OpenQ.deploy(userAddressStorage.address, depositStorage.address);

		await depositStorage.setOpenQ(openQ.address);
		await userAddressStorage.setOpenQ(openQ.address);

		const address = '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690';
		const gitHubUsername = 'alo9507';

		// insert new user
		await openQ.registerUserAddress(gitHubUsername, address);
		expect(await userAddressStorage.addresses(gitHubUsername)).to.equal(address);
		expect(await userAddressStorage.userIdsByAddress(address)).to.equal(gitHubUsername);

		// update existing user
		const newAddress = '0x947F3FC93AB8b74C44F837d3031347DDBb32cf08';

		await openQ.registerUserAddress(gitHubUsername, newAddress);
		expect(await userAddressStorage.addresses(gitHubUsername)).to.equal(newAddress);
		expect(await userAddressStorage.userIdsByAddress(newAddress)).to.equal(gitHubUsername);
	});

	it('withdrawIssueDeposit should send deposit amount to claimers address and remove the issueId', async () => {
		const UserAddressStorage = await ethers.getContractFactory('UserAddressStorage');
		const userAddressStorage = await UserAddressStorage.deploy();

		const DepositStorage = await ethers.getContractFactory('DepositStorage');
		const depositStorage = await DepositStorage.deploy();

		const OpenQ = await ethers.getContractFactory('OpenQ');
		const openQ = await OpenQ.deploy(userAddressStorage.address, depositStorage.address);

		await depositStorage.setOpenQ(openQ.address);
		await userAddressStorage.setOpenQ(openQ.address);

		// Fund issue
		const mockIssueId = 'mockIssueId';
		let overrides = {
			value: ethers.utils.parseEther('1.0')
		};
		await openQ.depositEthForIssue('mockIssueId', overrides);

		// Fetch a contractor account
		const accounts = await ethers.getSigners();
		const contractor = accounts[1];

		// Fetch a contractor account
		const contractorBalanceBefore = bigNumberToEtherFloat(await ethers.provider.getBalance(contractor.address));

		const gitHubUsername = 'alo9507';

		// insert new user
		await openQ.registerUserAddress(gitHubUsername, contractor.address);

		// Withdraw issue deposit
		const payoutAmount = bigNumberToEtherFloat(await depositStorage.issueDepositsAmountByIssueId(mockIssueId));
		await openQ.withdrawIssueDeposit('mockIssueId', 'alo9507');

		// Fetch new contractor balance
		const contractorBalanceAfter = bigNumberToEtherFloat(await ethers.provider.getBalance(contractor.address));

		// Expect contractor balance to be approximately contractorBalanceBefore + payoutAmount
		expect(contractorBalanceAfter).to.equal(contractorBalanceBefore + payoutAmount);

		// Expect issueId to have amount 0
		const payoutAmountAfter = bigNumberToEtherFloat(await depositStorage.issueDepositsAmountByIssueId(mockIssueId));
		expect(payoutAmountAfter).to.equal(0);

		// Expect issue to be claimed
		const status = await depositStorage.issueStatusByIssueId(mockIssueId);
		expect(issueStatusEnum[status]).to.equal('CLAIMED');
	});
});