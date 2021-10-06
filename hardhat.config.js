require("@nomiclabs/hardhat-waffle");
require('custom-env').env(process.env.DEPLOY_ENV);

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

module.exports = (function () {
    let chainId = process.env.CHAIN_ID;
    const chainIdInt = parseInt(chainId);

    const config = {
        solidity: "0.8.4",
        networks: {
            localhost: {
                url: process.env.PROVIDER_URL,
            },
            mumbai: {
                url: process.env.PROVIDER_URL,
                accounts: [process.env.WALLET_KEY],
                chainId: chainIdInt,
                gas: 3000000
            },
            polygon: {
                url: process.env.PROVIDER_URL,
                accounts: [process.env.WALLET_KEY],
                chainId: chainIdInt
            },
            rinkeby: {
                url: process.env.PROVIDER_URL,
                accounts: [process.env.WALLET_KEY],
            },
        },
    };

    return config;
})();
