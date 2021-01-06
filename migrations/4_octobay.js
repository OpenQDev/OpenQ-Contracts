require("dotenv").config({ path: './../.env' });
const OctoBay = artifacts.require("OctoBay");
const LinkToken = artifacts.require("link-token/LinkToken");

module.exports = function (deployer) {
  if (process.env.DEV) {
    deployer.deploy(OctoBay, LinkToken.address, "", "", "", process.env.GSN_FORWARDER_ADDRESS);
  } else {
    deployer.deploy(OctoBay, "", "", "", process.env.GSN_FORWARDER_ADDRESS);
  }
};
