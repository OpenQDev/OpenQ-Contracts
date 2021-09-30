const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const content = `RPC_NODE="${process.env.PROVIDER_URL}"\nWALLET_KEY="${process.env.WALLET_KEY}"\n`;
    fs.writeFileSync('.env.docker', content);

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();
    await mockToken.deployed();

    const FakeToken = await hre.ethers.getContractFactory("FakeToken");
    const fakeToken = await FakeToken.deploy();
    await fakeToken.deployed();

    const OpenQ = await hre.ethers.getContractFactory("OpenQ");
    const openQ = await OpenQ.deploy();
    await openQ.deployed();

    await openQ.addTokenAddress(mockToken.address);
    await openQ.addTokenAddress(fakeToken.address);

    console.log("MockToken deployed to:", mockToken.address);
    console.log("FakeToken deployed to:", fakeToken.address);
    console.log("OpenQ deployed to:", openQ.address);

    const githubIssueIds = ["I_kwDOGAqhQc48M_2V", "I_kwDOGAqhQc48U54v", "I_kwDOGAqhQc48U5_r"];

    await openQ.mintBounty(githubIssueIds[0]);
    await openQ.mintBounty(githubIssueIds[1]);
    await openQ.mintBounty(githubIssueIds[2]);

    const bounty1Address = await openQ.getBountyAddress(githubIssueIds[0]);

    console.log("bounty1Address", bounty1Address);
    await fakeToken.transfer(bounty1Address, 1000000);

    const openQAddress = `OPENQ_ADDRESS="${openQ.address}"\n`;
    fs.appendFileSync('.env.docker', openQAddress);

    const mockTokenAddress = `MOCK_TOKEN_ADDRESS="${mockToken.address}"\n`;
    fs.appendFileSync('.env.docker', mockTokenAddress);

    const fakeTokenAddress = `FAKE_TOKEN_ADDRESS="${fakeToken.address}"\n`;
    fs.appendFileSync('.env.docker', fakeTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
