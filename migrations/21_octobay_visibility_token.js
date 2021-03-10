require("dotenv").config({ path: './../.env' })
const OctobayVisibilityToken = artifacts.require("OctobayVisibilityToken")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(OctobayVisibilityToken)
}
