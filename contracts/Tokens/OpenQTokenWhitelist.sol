// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @dev Custom imports
 */
import './TokenWhitelist.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
contract OpenQTokenWhitelist is TokenWhitelist {
    /**
     * INITIALIZATION
     */

    /**
     * @dev Initializes OpenQTokenWhitelist with maximum token address limit to prevent out-of-gas errors
     * @param _tokenAddressLimit Maximum number of token addresses allowed
     */
    constructor(uint256 _tokenAddressLimit) TokenWhitelist() {
        TOKEN_ADDRESS_LIMIT = _tokenAddressLimit;
    }
}
