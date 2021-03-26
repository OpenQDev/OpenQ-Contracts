require("dotenv").config({ path: './../.env' })
const OctobayGovernor = artifacts.require("OctobayGovernor")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OctobayGovernor)
}
