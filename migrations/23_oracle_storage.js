require("dotenv").config({ path: './../.env' })
const OracleStorage = artifacts.require("OracleStorage")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OracleStorage)
}
