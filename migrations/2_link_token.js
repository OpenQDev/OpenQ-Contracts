require("dotenv").config({ path: './../.env' });
const LinkToken = artifacts.require("link-token/LinkToken");

module.exports = function (deployer) {
  deployer.deploy(LinkToken);
};
