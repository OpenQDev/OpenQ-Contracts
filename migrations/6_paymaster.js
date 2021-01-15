require("dotenv").config({ path: './../.env' })
const OctoBay = artifacts.require("OctoBay")
const OctoBayPaymaster = artifacts.require("OctoBayPaymaster")

module.exports = function (deployer) {
  deployer.deploy(OctoBayPaymaster, OctoBay.address).then(paymasterInstance => {
    paymasterInstance.setRelayHub(process.env.GSN_RELAYHUB_ADDRESS)
    OctoBay.deployed().then(octoBayInstance => {
      octoBayInstance.setPaymaster(OctoBayPaymaster.address)
    })
  })
}
