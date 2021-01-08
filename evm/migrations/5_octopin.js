require("dotenv").config({ path: './../.env.deploy' })
const OctoBay = artifacts.require("OctoBay")
const OctoPin = artifacts.require("OctoPin")

module.exports = function (deployer) {
  deployer.deploy(OctoPin, OctoBay.address).then(() => {
    OctoBay.deployed().then(octoBayInstance => {
      octoBayInstance.setOctoPin(OctoPin.address)
    })
  })
}
