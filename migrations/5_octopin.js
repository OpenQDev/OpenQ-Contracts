require("dotenv").config({ path: './../.env' })
const OctoBay = artifacts.require("OctoBay")
const OctoPin = artifacts.require("OctoPin")

module.exports = function (deployer, network) {
  if(network == 'test') return;
  deployer.deploy(OctoPin, OctoBay.address).then(() => {
    OctoBay.deployed().then(octoBayInstance => {
      octoBayInstance.setOctoPin(OctoPin.address)
    })
  })
}
