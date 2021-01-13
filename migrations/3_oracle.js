require("dotenv").config({ path: './../.env' })
const Oracle = artifacts.require("Oracle")
const LinkToken = artifacts.require("link-token/LinkToken")

module.exports = function (deployer, network, accounts) {
  if (process.env.LOCAL == 'true') {
    deployer.deploy(Oracle, LinkToken.address).then(oracleInstance => {
      oracleInstance.setFulfillmentPermission(process.env.CHAINLINK_NODE_ADDRESS, true)
      web3.eth.sendTransaction({ from: accounts[0], to: process.env.CHAINLINK_NODE_ADDRESS, value: '10000000000000000000' })
    })
  }
}
