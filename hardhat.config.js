require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

module.exports = {
    solidity: "0.8.4",
    networks: {
        rinkeby: {
            url: process.env.RINKEBY_PROVIDER_URL,
            accounts: [process.env.RINKEBY_PRIVATE_KEY],
        },
    },
};
