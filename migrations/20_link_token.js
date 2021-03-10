require("dotenv").config({ path: './../.env' })
const LinkToken = artifacts.require("link-token/LinkToken")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  if (network == 'development') {
    deployer.deploy(LinkToken)
  }
}
