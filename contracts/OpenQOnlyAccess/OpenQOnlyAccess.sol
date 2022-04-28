// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/utils/Context.sol';

abstract contract OpenQOnlyAccess is Context {
    // OpenQProxy Contract
    address public openQ;

    function __OpenQOnlyAccess_init(address _openQ) internal {
        openQ = _openQ;
    }

    modifier onlyOpenQ() {
        require(_msgSender() == openQ, 'Method is only callable by OpenQ');
        _;
    }
}
