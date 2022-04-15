// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import './TokenWhitelist.sol';

/**
 * @title OpenQTokenWhitelist
 * @dev OpenQTokenWhitelist provides the list of verified token addresses
 */
contract OpenQTokenWhitelist is TokenWhitelist {
    constructor(uint256 _tokenAddressLimit) TokenWhitelist() {
        TOKEN_ADDRESS_LIMIT = _tokenAddressLimit;
    }
}
