// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
contract OpenQTokenWhitelist is Ownable {
    mapping(address => bool) internal whitelist;

    constructor() {}

    function addToken(address tokenAddress) external onlyOwner {
        whitelist[tokenAddress] = true;
    }

    function removeToken(address tokenAddress) external onlyOwner {
        whitelist[tokenAddress] = false;
    }

    function whitelisted(address tokenAddress) external returns (bool) {
        return whitelist[tokenAddress];
    }
}
