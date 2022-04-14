// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
contract OpenQTokenWhitelist {
    mapping(address => bool) internal whitelist;

    constructor() {}

    function addToken(address tokenAddress) external {
        whitelist[tokenAddress] = true;
    }

    function removeToken(address tokenAddress) external {
        whitelist[tokenAddress] = false;
    }

    function whitelisted(address tokenAddress) external returns (bool) {
        return whitelist[tokenAddress];
    }
}
