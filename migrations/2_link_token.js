require("dotenv").config({ path: './../.env' });
const LinkToken = artifacts.require("link-token/LinkToken");

module.exports = function (deployer) {
  if (process.env.DEV) {
    deployer.deploy(LinkToken);
  }
};
