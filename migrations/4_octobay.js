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
      // octoBayInstance.setOracle(Oracle.address, "Main")
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   1,
      //   web3.utils.toHex(process.env.CHAINLINK_REGISTER_JOB_ID),
      //   process.env.CHAINLINK_REGISTER_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   2,
      //   web3.utils.toHex(process.env.CHAINLINK_RELEASE_JOB_ID),
      //   process.env.CHAINLINK_RELEASE_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   3,
      //   web3.utils.toHex(process.env.CHAINLINK_CLAIM_JOB_ID),
      //   process.env.CHAINLINK_CLAIM_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   4,
      //   web3.utils.toHex(process.env.CHAINLINK_TWITTER_POST_JOB_ID),
      //   process.env.CHAINLINK_TWITTER_POST_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   5,
      //   web3.utils.toHex(process.env.CHAINLINK_TWITTER_FOLLOWERS_JOB_ID),
      //   process.env.CHAINLINK_TWITTER_FOLLOWERS_JOB_FEE
      // )
      LinkToken.deployed().then(linkTokenInstance => {
        linkTokenInstance.transfer(octoBayInstance.address, "10000000000000000000")
      })
    })
  } else if (network == 'kovan') {
    deployer.deploy(OctoBay, '0xa36085F69e2889c224210F603D836748e7dC0088', zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS).then(octoBayInstance => {
      octoBayInstance.setTwitterAccountId(process.env.OCTOBAY_TWITTER_ACCOUNT_ID)
      // octoBayInstance.setOracle(Oracle.address, "Main")
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   1,
      //   web3.utils.toHex(process.env.CHAINLINK_REGISTER_JOB_ID),
      //   process.env.CHAINLINK_REGISTER_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   2,
      //   web3.utils.toHex(process.env.CHAINLINK_RELEASE_JOB_ID),
      //   process.env.CHAINLINK_RELEASE_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   3,
      //   web3.utils.toHex(process.env.CHAINLINK_CLAIM_JOB_ID),
      //   process.env.CHAINLINK_CLAIM_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   4,
      //   web3.utils.toHex(process.env.CHAINLINK_TWITTER_POST_JOB_ID),
      //   process.env.CHAINLINK_TWITTER_POST_JOB_FEE
      // )
      // octoBayInstance.setOracleJob(
      //   Oracle.address,
      //   5,
      //   web3.utils.toHex(process.env.CHAINLINK_TWITTER_FOLLOWERS_JOB_ID),
      //   process.env.CHAINLINK_TWITTER_FOLLOWERS_JOB_FEE
      // )
    })
  }
}
