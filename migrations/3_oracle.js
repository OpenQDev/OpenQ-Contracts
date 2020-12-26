require("dotenv").config({ path: './../.env' });
const Oracle = artifacts.require("Oracle");
const LinkToken = artifacts.require("link-token/LinkToken");

module.exports = function (deployer) {
  if (process.env.DEV) {
    deployer.deploy(Oracle, LinkToken.address).then(oracleInstance => {
      oracleInstance.setFulfillmentPermission(process.env.CHAINLINK_NODE_ADDRESS, true)
    });
  }
};
