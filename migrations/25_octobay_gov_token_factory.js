require("dotenv").config({ path: './../.env' })
const OctobayGovTokenFactory = artifacts.require("OctobayGovTokenFactory")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OctobayGovTokenFactory)
}
