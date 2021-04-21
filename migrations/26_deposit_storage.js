require("dotenv").config({ path: './../.env' })
const IssueDepositStorage = artifacts.require("IssueDepositStorage")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(IssueDepositStorage)
}
