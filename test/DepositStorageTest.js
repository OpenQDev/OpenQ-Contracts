const { expect } = require("chai");

describe("DepositStorage contract", () => {
    it("setOpenQ should set openq address", async () => {
        const DepositStorage = await ethers.getContractFactory("DepositStorage");
        const depositStorage = await DepositStorage.deploy();

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

        await depositStorage.setOpenQ(address);
        expect(await depositStorage.openq()).to.equal(address);
    });

    it("can only be called from OpenQ contract", async () => {
        const DepositStorage = await ethers.getContractFactory("DepositStorage");
        const depositStorage = await DepositStorage.deploy();

        const accounts = await ethers.getSigners();
        const [owner] = await ethers.getSigners();
        await depositStorage.setOpenQ(owner.address);

        const stranger = accounts[1];
        let contractWithNonOwnerAccount = depositStorage.connect(stranger);

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
        const mockIssueId = "mockIssueId";

        await expect(contractWithNonOwnerAccount.withdrawIssueDeposit(address, mockIssueId)).to.be.revertedWith('OpenQStorage: Only the current OpenQ version can use this function.');
    });

    it("depositEthForIssue should associate issueId to amount on msg.value", async () => {
        const DepositStorage = await ethers.getContractFactory("DepositStorage");
        const depositStorage = await DepositStorage.deploy();

        const [owner] = await ethers.getSigners();
        await depositStorage.setOpenQ(owner.address); // setOpenQ to ethers owner since it's protected by the onlyOpenQ modifier

        const mockIssueId = "mockIssueId";

        let overrides = {
            value: ethers.utils.parseEther("1.0")
        };

        await depositStorage.depositEthForIssue("mockIssueId", "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097", overrides);

        const depositAmount = await depositStorage.issueDepositsAmountByIssueId(mockIssueId);

        expect(ethers.utils.formatEther(depositAmount)).to.equal("1.0");
    });

    it("withdrawIssueDeposit should send deposit amount to calimers address", async () => {
        // Instantiate contract and set up
        const DepositStorage = await ethers.getContractFactory("DepositStorage");
        const depositStorage = await DepositStorage.deploy();
        const [owner] = await ethers.getSigners();
        await depositStorage.setOpenQ(owner.address); // setOpenQ to ethers owner since it's protected by the onlyOpenQ modifier

        // Fund issue
        const mockIssueId = "mockIssueId";
        let overrides = {
            value: ethers.utils.parseEther("1.0")
        };
        await depositStorage.depositEthForIssue("mockIssueId", "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097", overrides);

        // Fetch a contractor account
        const accounts = await ethers.getSigners();
        const contractor = accounts[1];

        // Fetch a contractor account
        const contractorBalanceBefore = await ethers.provider.getBalance(contractor.address);

        // Withdraw issue deposit
        const payoutAmount = await depositStorage.withdrawIssueDeposit(contractor.address, "mockIssueId");

        // Fetch new contractor balance
        const contractorBalanceAfter = ethers.utils.formatEther(await ethers.provider.getBalance(contractor.address));

        expect(contractorBalanceAfter).to.equal(contractorBalanceBefore.add(payoutAmount));
    });
});