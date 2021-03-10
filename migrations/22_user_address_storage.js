require("dotenv").config({ path: './../.env' })
const UserAddressStorage = artifacts.require("UserAddressStorage")

module.exports = function (deployer, network) {
  if (network == 'test') return;
  deployer.deploy(UserAddressStorage)
}
