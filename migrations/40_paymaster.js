require("dotenv").config({ path: './../.env' })

const Octobay = artifacts.require("Octobay")
const OctobayPaymaster = artifacts.require("OctobayPaymaster")

module.exports = function (deployer, network, accounts) {
  if (network == 'test') return;
  deployer.deploy(OctobayPaymaster, Octobay.address).then(paymasterInstance => {
    paymasterInstance.setRelayHub(process.env.GSN_RELAYHUB_ADDRESS)
    Octobay.deployed().then(octobayInstance => {
      octobayInstance.setPaymaster(OctobayPaymaster.address)
      if (network == 'development') {
        web3.eth.sendTransaction({ from: accounts[0], to: OctobayPaymaster.address, value: '1000000000000000000' })
      }
    })
  })
}
