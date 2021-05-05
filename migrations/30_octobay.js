require("dotenv").config({ path: './../.env' })

const Octobay = artifacts.require("Octobay")
const LinkToken = artifacts.require("link-token/LinkToken")
const UserAddressStorage = artifacts.require("UserAddressStorage")
const OracleStorage = artifacts.require("OracleStorage")
const DepositStorage = artifacts.require("DepositStorage")
const OctobayGovernor = artifacts.require("OctobayGovernor")
const OctobayGovNFT = artifacts.require("OctobayGovNFT")
const zeroAddress = "0x0000000000000000000000000000000000000000"

module.exports = function (deployer, network) {
  if (network == 'test') return;
  if (network == 'development') {
    deployer.deploy(
      Octobay,
      LinkToken.address,
      zeroAddress,
      UserAddressStorage.address,
      OracleStorage.address,
      DepositStorage.address,
      OctobayGovernor.address,
      OctobayGovNFT.address,
      zeroAddress,
    ).then(async (octobayInstance) => {
      octobayInstance.setTwitterAccountId(process.env.OCTOBAY_TWITTER_ACCOUNT_ID)
      const linkTokenInstance = await LinkToken.deployed()
      linkTokenInstance.transfer(octobayInstance.address, "10000000000000000000")

      const UserAddressStorageInstance = await UserAddressStorage.deployed()
      UserAddressStorageInstance.setOctobay(octobayInstance.address)
      
      const OracleStorageInstance = await OracleStorage.deployed()
      OracleStorageInstance.setOctobay(octobayInstance.address)

      const DepositStorageInstance = await DepositStorage.deployed()
      DepositStorageInstance.setOctobay(octobayInstance.address)

      const OctobayGovernorInstance = await OctobayGovernor.deployed()
      OctobayGovernorInstance.setOctobay(octobayInstance.address)

      const OctobayGovNFTInstance = await OctobayGovNFT.deployed()
      OctobayGovNFTInstance.setOctobay(octobayInstance.address)
    })
  } else if (network == 'kovan') {
    deployer.deploy(
      Octobay,
      '0xa36085F69e2889c224210F603D836748e7dC0088',
      zeroAddress,
      UserAddressStorage.address,
      OracleStorage.address,
      DepositStorage.address,
      OctobayGovernor.address,
      OctobayGovNFT.address,
      '0x9326BFA02ADD2366b30bacB125260Af641031331',
    ).then(async (octobayInstance) => {
      const UserAddressStorageInstance = await UserAddressStorage.deployed()
      UserAddressStorageInstance.setOctobay(octobayInstance.address)
      
      const OracleStorageInstance = await OracleStorage.deployed()
      OracleStorageInstance.setOctobay(octobayInstance.address)

      const DepositStorageInstance = await DepositStorage.deployed()
      DepositStorageInstance.setOctobay(octobayInstance.address)

      const OctobayGovernorInstance = await OctobayGovernor.deployed()
      OctobayGovernorInstance.setOctobay(octobayInstance.address)

      const OctobayGovNFTInstance = await OctobayGovNFT.deployed()
      OctobayGovNFTInstance.setOctobay(octobayInstance.address)
    })
  }
}
