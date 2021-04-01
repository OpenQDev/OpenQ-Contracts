require("dotenv").config({ path: './../.env' })
const OctobayGovernor = artifacts.require("OctobayGovernor")
const OctobayGovNFT = artifacts.require("OctobayGovNFT")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OctobayGovernor, OctobayGovNFT.address)
}
