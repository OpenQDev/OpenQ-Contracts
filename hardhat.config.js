require("@nomiclabs/hardhat-waffle");
require('custom-env').env(process.env.DEPLOY_ENV);

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
            url: process.env.PROVIDER_URL,
            accounts: [process.env.WALLET_KEY],
        },
        localhost: {
            url: process.env.PROVIDER_URL,
            accounts: [process.env.WALLET_KEY],
        },
    },
};
