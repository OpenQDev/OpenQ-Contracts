require("dotenv").config({ path: './../../.env' })
const Web3 = require("web3")
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545")
const sh = require('shelljs')

const OctoBay = artifacts.require("OctoBay")
const LinkToken = artifacts.require("link-token/LinkToken")
const Oracle = artifacts.require("Oracle")
const zeroAddress = "0x0000000000000000000000000000000000000000"

const jobs = {
  register: null,
  release: null,
  claim: null,
  graphqlbool: null,
  graphqlbytes32: null,
  graphqlint256: null,
  graphqluint256: null
}

sh.ls('./../../chainlink/.jobs/*.json').forEach((file) => {
  const job = file.match(/(register|release|claim)\.([a-f0-9]{32})/i)
  if (job) {
    jobs[job[1]] = job[2]
  }
})

sh.ls('./../../chainlink/.jobs/graphql/*.json').forEach((file) => {
  const job = file.match(/(bool|bytes32|int256|uint256)\.([a-f0-9]{32})/i)
  if (job) {
    jobs['graphql' + job[1]] = job[2]
  }
})

module.exports = function (deployer) {
  if (process.env.LOCAL == 'true') {
    deployer.deploy(OctoBay, LinkToken.address, zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS).then(octoBayInstance => {
      octoBayInstance.setPaymaster(process.env.GSN_PAYMASTER_ADDRESS)
      octoBayInstance.setOracle(
        Oracle.address,
        "Main",
        web3.utils.toHex(jobs.register),
        web3.utils.toHex(jobs.release),
        web3.utils.toHex(jobs.claim),
        web3.utils.toHex(jobs.graphqlbool),
        web3.utils.toHex(jobs.graphqlbytes32),
        web3.utils.toHex(jobs.graphqlint256),
        web3.utils.toHex(jobs.graphqluint256)
      )
    })
  } else {
    deployer.deploy(OctoBay, zeroAddress, zeroAddress, zeroAddress, process.env.GSN_FORWARDER_ADDRESS)
  }
}
