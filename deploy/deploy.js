const hre = require("hardhat");

async function main() {
    const DepositStorage = await hre.ethers.getContractFactory("DepositStorage");
    const depositStorage = await DepositStorage.deploy();
    await depositStorage.deployed();

    const UserAddressStorage = await hre.ethers.getContractFactory("UserAddressStorage");
    const userAddressStorage = await UserAddressStorage.deploy();
    await userAddressStorage.deployed();

    const OpenQ = await hre.ethers.getContractFactory("OpenQ");
    const openQ = await OpenQ.deploy(userAddressStorage.address, depositStorage.address);
    await openQ.deployed();

    await depositStorage.setOpenQ(openQ.address);
    await userAddressStorage.setOpenQ(openQ.address);

    console.log("OpenQ deployed to:", openQ.address);
    console.log("DepositStorage deployed to:", depositStorage.address);
    console.log("UserAddressStorage deployed to:", userAddressStorage.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
