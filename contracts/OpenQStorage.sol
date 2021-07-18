// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

contract OpenQStorage is Ownable {
    address public _openQExecutorAddress;

    modifier onlyOpenQExecutor() {
        require(
            msg.sender == _openQExecutorAddress,
            'OpenQStorage: Only the current OpenQ version can use this function.'
        );
        _;
    }

    function setOpenQExecutor(address _openQExecutorAddress) public onlyOwner {
        openQ = _openQExecutorAddress;
    }
}
