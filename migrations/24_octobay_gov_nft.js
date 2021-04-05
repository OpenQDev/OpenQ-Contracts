require("dotenv").config({ path: './../.env' })
const OctobayGovNFT = artifacts.require("OctobayGovNFT")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OctobayGovNFT, "Octobay Governance Permissions", "OGPERM")
}
