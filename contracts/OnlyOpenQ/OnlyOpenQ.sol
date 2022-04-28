// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/utils/Context.sol';

abstract contract OnlyOpenQ is Context {
    address public openQ;

    function __OnlyOpenQ_init(address _openQ) internal {
        openQ = _openQ;
    }

    modifier onlyOpenQ() {
        require(_msgSender() == openQ, 'Method is only callable by OpenQ');
        _;
    }
}
