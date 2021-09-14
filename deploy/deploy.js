const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const content = `RPC_NODE="${process.env.PROVIDER_URL}"\nWALLET_KEY="${process.env.WALLET_KEY}"\n`;
    fs.writeFileSync('.env.docker', content);

    // const DepositStorage = await hre.ethers.getContractFactory("DepositStorage");
    // const depositStorage = await DepositStorage.deploy();
    // await depositStorage.deployed();

    // const UserAddressStorage = await hre.ethers.getContractFactory("UserAddressStorage");
    // const userAddressStorage = await UserAddressStorage.deploy();
    // await userAddressStorage.deployed();

    // const OpenQ = await hre.ethers.getContractFactory("OpenQ");
    // const openQ = await OpenQ.deploy(userAddressStorage.address, depositStorage.address);
    // await openQ.deployed();

    // await depositStorage.setOpenQ(openQ.address);
    // await userAddressStorage.setOpenQ(openQ.address);

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();
    await mockToken.deployed();

    // await depositStorage.setTokenAddress("MOCK", mockToken.address);

    const TestOpenQ = await hre.ethers.getContractFactory("TestOpenQ");
    const testOpenQ = await TestOpenQ.deploy();
    await testOpenQ.deployed();

    // console.log("OpenQ deployed to:", openQ.address);
    // console.log("DepositStorage deployed to:", depositStorage.address);
    // console.log("UserAddressStorage deployed to:", userAddressStorage.address);
    console.log("MockToken deployed to:", mockToken.address);
    console.log("TestOpenQ deployed to:", testOpenQ.address);

    // const openQAddress = `OPENQ_ADDRESS="${openQ.address}"`;
    // fs.appendFileSync('.env.docker', openQAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
