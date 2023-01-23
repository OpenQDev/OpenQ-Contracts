// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../Library/Errors.sol';

/// @title TokenWhitelist
/// @author FlacoJones
/// @notice Base contract for token whitelists
/// @dev Whitelisting and token address limit is implemented primarily as a means of preventing out-of-gas exceptions when looping over funded addresses for payouts
abstract contract TokenWhitelist is Ownable {
    uint256 public TOKEN_ADDRESS_LIMIT;
    uint256 public tokenCount;
    mapping(address => bool) public whitelist;

    /// @notice Determines if a tokenAddress is whitelisted
    /// @param _tokenAddress The token address on which to check whitelisting status
    /// @return bool Whether or not tokenAddress is whitelisted
    function isWhitelisted(address _tokenAddress) external view returns (bool) {
        return whitelist[_tokenAddress];
    }

    /// @notice Adds tokenAddress to the whitelist
    /// @param _tokenAddress The token address to add to the whitelist
    function addToken(address _tokenAddress) external onlyOwner {
        require(
            !this.isWhitelisted(_tokenAddress),
            Errors.TOKEN_ALREADY_WHITELISTED
        );
        whitelist[_tokenAddress] = true;
        tokenCount++;
    }

    /// @notice Removes tokenAddress to the whitelist
    /// @param _tokenAddress The token address to remove from the whitelist
    function removeToken(address tokenAddress) external onlyOwner {
        require(
            this.isWhitelisted(tokenAddress),
            Errors.TOKEN_NOT_ALREADY_WHITELISTED
        );
        whitelist[tokenAddress] = false;
        tokenCount--;
    }

    /// @notice Updates the tokenAddressLimit
    /// @param _newTokenAddressLimit The new value for TOKEN_ADDRESS_LIMIT
    function setTokenAddressLimit(uint256 _newTokenAddressLimit)
        external
        onlyOwner
    {
        TOKEN_ADDRESS_LIMIT = newTokenAddressLimit;
    }
}
