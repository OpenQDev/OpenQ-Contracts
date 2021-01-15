require("dotenv").config({ path: './../.env' })
const OctoBay = artifacts.require("OctoBay")
const OctoBayPaymaster = artifacts.require("OctoBayPaymaster")

module.exports = function (deployer, network, accounts) {
  deployer.deploy(OctoBayPaymaster, OctoBay.address).then(paymasterInstance => {
    paymasterInstance.setRelayHub(process.env.GSN_RELAYHUB_ADDRESS)
    OctoBay.deployed().then(octoBayInstance => {
      octoBayInstance.setPaymaster(OctoBayPaymaster.address)
      web3.eth.sendTransaction({ from: accounts[0], to: OctoBayPaymaster.address, value: '1000000000000000000' })
    })
  })
}
