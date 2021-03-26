require("dotenv").config({ path: './../.env' })

const Octobay = artifacts.require("Octobay")
const LinkToken = artifacts.require("link-token/LinkToken")
const OctobayVisibilityToken = artifacts.require("OctobayVisibilityToken")
const UserAddressStorage = artifacts.require("UserAddressStorage")
const OracleStorage = artifacts.require("OracleStorage")
const OctobayGovernor = artifacts.require("OctobayGovernor")
const OctobayGovTokenFactory = artifacts.require("OctobayGovTokenFactory")
const zeroAddress = "0x0000000000000000000000000000000000000000"

module.exports = function (deployer, network) {
  if (network == 'test') return;
  if (network == 'development') {
    deployer.deploy(
      Octobay,
      LinkToken.address,
      zeroAddress,
      OctobayVisibilityToken.address,
      UserAddressStorage.address,
      OracleStorage.address,
      OctobayGovernor.address,
      OctobayGovTokenFactory.address
    ).then(octobayInstance => {
      octobayInstance.setTwitterAccountId(process.env.OCTOBAY_TWITTER_ACCOUNT_ID)
      LinkToken.deployed().then(linkTokenInstance => {
        linkTokenInstance.transfer(octobayInstance.address, "10000000000000000000")
      })

      OctobayVisibilityToken.deployed(OctobayVisibilityTokenInstance => {
        OctobayVisibilityTokenInstance.setOctobay(octobayInstance.address)
      })
      UserAddressStorage.deployed(UserAddressStorageInstance => {
        UserAddressStorageInstance.setOctobay(octobayInstance.address)
      })
      OracleStorage.deployed(OracleStorageInstance => {
        OracleStorageInstance.setOctobay(octobayInstance.address)
      })
      OctobayGovernor.deployed(OctobayGovernorInstance => {
        OctobayGovernorInstance.setOctobay(octobayInstance.address)
      })
      OctobayGovTokenFactory.deployed(OctobayGovTokenFactoryInstance => {
        OctobayGovTokenFactoryInstance.setOctobay(octobayInstance.address)
      })      
    })
  } else if (network == 'kovan') {
    deployer.deploy(
      Octobay,
      '0xa36085F69e2889c224210F603D836748e7dC0088',
      zeroAddress,
      '0x0842Ad6B8cb64364761C7c170D0002CC56b1c498',
      UserAddresses.address,
      Oracles.address,
      OctobayGovernor.address,
      OctobayGovTokenFactory.address      
    )
  }
}
