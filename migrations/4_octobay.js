require("dotenv").config({ path: './../.env' })
const Web3 = require("web3")
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545")

const OctoBay = artifacts.require("OctoBay")
const LinkToken = artifacts.require("link-token/LinkToken")
const Oracle = artifacts.require("Oracle")
const zeroAddress = "0x0000000000000000000000000000000000000000"

module.exports = function (deployer, network, accounts) {
  if (process.env.LOCAL == 'true') {
    deployer.deploy(OctoBay, LinkToken.address, zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS).then(octoBayInstance => {
      octoBayInstance.setPaymaster(process.env.GSN_PAYMASTER_ADDRESS)
      octoBayInstance.setOracle(
        Oracle.address,
        "Main",
        process.env.CHAINLINK_REGISTER_JOB_ID,
        process.env.CHAINLINK_RELEASE_JOB_ID,
        process.env.CHAINLINK_CLAIM_JOB_ID,
        process.env.CHAINLINK_REGISTER_JOB_FEE,
        process.env.CHAINLINK_RELEASE_JOB_FEE,
        process.env.CHAINLINK_CLAIM_JOB_FEE,
      )
      LinkToken.deployed().then(linkTokenInstance => {
        linkTokenInstance.transfer(octoBayInstance.address, "10000000000000000000")
      })
    })
  } else {
    deployer.deploy(OctoBay, zeroAddress, zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS)
  }
}
