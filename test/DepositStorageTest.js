const { expect } = require("chai");

describe("DepositStorage contract", () => {
    it("setOpenQ should set openq address", async () => {
        const DepositStorage = await ethers.getContractFactory("DepositStorage");
        const depositStorage = await DepositStorage.deploy();

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

        await depositStorage.setOpenQ(address);
        expect(await depositStorage.openq()).to.equal(address);
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
});