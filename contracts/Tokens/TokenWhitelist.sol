// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
abstract contract TokenWhitelist is Ownable {
    uint256 public TOTAL_TOKEN_ADDRESSES;

    mapping(address => bool) public whitelist;

    function addToken(address tokenAddress) external onlyOwner {
        whitelist[tokenAddress] = true;
    }

    function removeToken(address tokenAddress) external onlyOwner {
        whitelist[tokenAddress] = false;
    }

    function isWhitelisted(address tokenAddress) external view returns (bool) {
        return whitelist[tokenAddress];
    }
}
