// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
abstract contract TokenWhitelist is Ownable {
    uint256 public TOKEN_ADDRESS_LIMIT;
    uint256 public tokenCount;

    mapping(address => bool) public whitelist;

    function isWhitelisted(address tokenAddress) external view returns (bool) {
        return whitelist[tokenAddress];
    }

    function addToken(address tokenAddress) external onlyOwner {
        require(tokenCount <= TOKEN_ADDRESS_LIMIT, 'TOO_MANY_TOKEN_ADDRESSES');
        require(!this.isWhitelisted(tokenAddress), 'TOKEN_ALREADY_WHITELISTED');
        whitelist[tokenAddress] = true;
        tokenCount++;
    }

    function removeToken(address tokenAddress) external onlyOwner {
        require(
            this.isWhitelisted(tokenAddress),
            'TOKEN_NOT_ALREADY_WHITELISTED'
        );
        whitelist[tokenAddress] = false;
        tokenCount--;
    }

    function setTokenAddressLimit(uint256 newTokenAddressLimit)
        external
        onlyOwner
    {
        TOKEN_ADDRESS_LIMIT = newTokenAddressLimit;
    }
}
