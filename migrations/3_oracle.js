require("dotenv").config({ path: './../.env' })
const Oracle = artifacts.require("Oracle")
const LinkToken = artifacts.require("link-token/LinkToken")

module.exports = function (deployer, network, accounts) {
  if (network == 'development') {
    deployer.deploy(Oracle, LinkToken.address).then(oracleInstance => {
      oracleInstance.setFulfillmentPermission(process.env.CHAINLINK_NODE_ADDRESS, true)
      web3.eth.sendTransaction({ from: accounts[0], to: process.env.CHAINLINK_NODE_ADDRESS, value: '1000000000000000000' })
    })
  } else if (network == 'kovan') {
    deployer.deploy(Oracle, '0xa36085F69e2889c224210F603D836748e7dC0088').then(oracleInstance => {
      oracleInstance.setFulfillmentPermission(process.env.CHAINLINK_NODE_ADDRESS, true)
    })
  }
}
