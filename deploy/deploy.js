const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const content = `\nPROVIDER_URL="${process.env.PROVIDER_URL}"\nWALLET_KEY="${process.env.WALLET_KEY}"\n`;
    fs.appendFileSync('.env.docker', content);

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

    // must wait 3.5 seconds or so for propogation on Mumbai
    if (process.env.DEPLOY_ENV == "mumbai") {
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

    console.log("Bounty 1 minted to:", bounty1Address);
    console.log("Bounty 2 minted to:", bounty2Address);
    console.log("Bounty 3 minted to:", bounty3Address);

    await fakeToken.transfer(bounty1Address, 1000000);
    await mockToken.transfer(bounty1Address, 2500000);

    const openQAddress = `OPENQ_ADDRESS="${openQ.address}"\n`;
    fs.appendFileSync('.env.docker', openQAddress);

    const contractorPublicAddress = `CONTRACTOR_PUBLIC_ADDRESS="${process.env.CONTRACTOR_PUBLIC_ADDRESS}"\n`;
    fs.appendFileSync('.env.docker', contractorPublicAddress);

    const contractorPrivateKey = `CONTRACTOR_PRIVATE_KEY="${process.env.CONTRACTOR_PRIVATE_KEY}"\n`;
    fs.appendFileSync('.env.docker', contractorPrivateKey);

    const fakeTokenAddress = `FAKE_TOKEN_ADDRESS="${fakeToken.address}"\n`;
    fs.appendFileSync('.env.docker', fakeTokenAddress);

    const mockTokenAddress = `MOCK_TOKEN_ADDRESS="${mockToken.address}"\n`;
    fs.appendFileSync('.env.docker', mockTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
