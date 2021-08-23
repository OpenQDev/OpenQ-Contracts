require("dotenv").config({ path: './../.env' });

const OpenQ = artifacts.require("OpenQ");
const UserAddressStorage = artifacts.require("UserAddressStorage");
const DepositStorage = artifacts.require("DepositStorage");
const zeroAddress = "0x0000000000000000000000000000000000000000";

module.exports = function (deployer, network) {
  if (network == 'test') return;
  if (network == 'development') {
    deployer.deploy(
      OpenQ,
      UserAddressStorage.address,
      DepositStorage.address,
    ).then(async (openqInstance) => {
      const UserAddressStorageInstance = await UserAddressStorage.deployed();
      UserAddressStorageInstance.setOpenQ(openqInstance.address);

      const DepositStorageInstance = await DepositStorage.deployed();
      DepositStorageInstance.setOpenQ(openqInstance.address);
    });
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
      const UserAddressStorageInstance = await UserAddressStorage.deployed();
      UserAddressStorageInstance.setOpenQ(octobayInstance.address);

      const DepositStorageInstance = await DepositStorage.deployed();
      DepositStorageInstance.setOpenQ(octobayInstance.address);
    });
  }
};
