// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

abstract contract OpenQOnlyAccess {
    // OpenQ Proxy Contract
    address public openQ;

    function __OpenQOnlyAccess_init(address _openQ) internal {
        openQ = _openQ;
    }

    // Modifiers
    modifier onlyOpenQ() {
        require(msg.sender == openQ, 'Method is only callable by OpenQ');
        _;
    }
}
