require("dotenv").config({ path: './../.env' })
const DepositStorage = artifacts.require("DepositStorage")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(DepositStorage)
}
