require("dotenv").config({ path: './../.env.deploy' })
const LinkToken = artifacts.require("link-token/LinkToken")

module.exports = function (deployer) {
  if (process.env.LOCAL == 'true') {
    deployer.deploy(LinkToken)
  }
}
