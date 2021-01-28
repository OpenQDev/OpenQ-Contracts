require("dotenv").config({ path: './../.env' })
const Web3 = require("web3")
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545")

const OctoBay = artifacts.require("OctoBay")
const LinkToken = artifacts.require("link-token/LinkToken")
const Oracle = artifacts.require("Oracle")
const zeroAddress = "0x0000000000000000000000000000000000000000"

module.exports = function (deployer, network, accounts) {
  if(network == 'test') return;
  if (network == 'development') {
    deployer.deploy(OctoBay, LinkToken.address, zeroAddress, zeroAddress, zeroAddress).then(octoBayInstance => {
      octoBayInstance.setTwitterAccountId(process.env.OCTOBAY_TWITTER_ACCOUNT_ID)
      LinkToken.deployed().then(linkTokenInstance => {
        linkTokenInstance.transfer(octoBayInstance.address, "10000000000000000000")
      })
    })
  } else if (network == 'kovan') {
    deployer.deploy(OctoBay, '0xa36085F69e2889c224210F603D836748e7dC0088', zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS).then(octoBayInstance => {
      octoBayInstance.setTwitterAccountId(process.env.OCTOBAY_TWITTER_ACCOUNT_ID)
    })
  }
}
