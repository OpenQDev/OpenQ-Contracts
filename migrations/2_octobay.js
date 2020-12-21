require("dotenv").config({ path: './../.env' });
const OctoBay = artifacts.require("OctoBay");

module.exports = function (deployer) {
  deployer.deploy(OctoBay, process.env.LINK_TOKEN_ADDRESS);
};
