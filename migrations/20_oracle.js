require("dotenv").config({ path: './../.env' })
const LinkToken = artifacts.require("link-token/LinkToken")
const Oracle = artifacts.require("oracle/Oracle")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  if (network == 'development') {
    deployer.deploy(Oracle, LinkToken.address).then(oracleInstance => {
      oracleInstance.setFulfillmentPermission(process.env.CHAINLINK_NODE_ADDRESS, true)
    })
  }
}
