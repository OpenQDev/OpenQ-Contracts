require("@nomiclabs/hardhat-waffle");

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
            url: `https://rinkeby.infura.io/v3/3b83a506f358431399e427135570f8e8`,
            accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
        },
    },
};
