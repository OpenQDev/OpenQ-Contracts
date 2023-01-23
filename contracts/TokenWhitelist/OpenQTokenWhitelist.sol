// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './TokenWhitelist.sol';

/// @title OpenQTokenWhitelist
/// @author FlacoJones
/// @notice OpenQTokenWhitelist provides the list of verified token addresses
/// @dev Whitelisting and token address limit is implemented primarily as a means of preventing out-of-gas exceptions when looping over funded addresses for payouts
contract OpenQTokenWhitelist is TokenWhitelist {
    /// @notice Initializes OpenQTokenWhitelist with maximum token address limit to prevent out-of-gas errors
    /// @param _tokenAddressLimit Maximum number of token addresses allowed
    constructor(uint256 _tokenAddressLimit) TokenWhitelist() {
        TOKEN_ADDRESS_LIMIT = _tokenAddressLimit;
    }
}
