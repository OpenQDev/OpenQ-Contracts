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
            accounts: [`0x0eec94c178a39b7cbef7ab95bdabc92a43d574ae59159f08f922276dcb4238af`],
        },
    },
};
