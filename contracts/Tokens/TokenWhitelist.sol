// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @dev Third party
 */
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
abstract contract TokenWhitelist is Ownable {
    /**
     * INITIALIZATION
     */

    uint256 public TOKEN_ADDRESS_LIMIT;
    uint256 public tokenCount;
    mapping(address => bool) public whitelist;

    /**
     * UTILITY
     */

    /**
     * @dev Determines if a tokenAddress is whitelisted
     * @param tokenAddress The token address in question
     * @return bool Whether or not tokenAddress is whitelisted
     */
    function isWhitelisted(address tokenAddress) external view returns (bool) {
        return whitelist[tokenAddress];
    }

    /**
     * @dev Adds tokenAddress to the whitelist
     * @param tokenAddress The token address to add
     */
    function addToken(address tokenAddress) external onlyOwner {
        require(tokenCount <= TOKEN_ADDRESS_LIMIT, 'TOO_MANY_TOKEN_ADDRESSES');
        require(!this.isWhitelisted(tokenAddress), 'TOKEN_ALREADY_WHITELISTED');
        whitelist[tokenAddress] = true;
        tokenCount++;
    }

    /**
     * @dev Removes tokenAddress to the whitelist
     * @param tokenAddress The token address to remove
     */
    function removeToken(address tokenAddress) external onlyOwner {
        require(
            this.isWhitelisted(tokenAddress),
            'TOKEN_NOT_ALREADY_WHITELISTED'
        );
        whitelist[tokenAddress] = false;
        tokenCount--;
    }

    /**
     * @dev Updates the tokenAddressLimit
     * @param newTokenAddressLimit The new value for TOKEN_ADDRESS_LIMIT
     */
    function setTokenAddressLimit(uint256 newTokenAddressLimit)
        external
        onlyOwner
    {
        TOKEN_ADDRESS_LIMIT = newTokenAddressLimit;
    }
}
