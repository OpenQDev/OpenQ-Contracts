// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

contract OpenQExecutorAdmin is Ownable {
    address public _openQExecutorAddress;

    modifier onlyOpenQExecutor() {
        require(
            msg.sender == _openQExecutorAddress,
            'Only the current OpenQExecutor can call this administrative function.'
        );
        _;
    }

    function setOpenQExecutor(address _openQExecutorAddress) public onlyOwner {
        openQ = _openQExecutorAddress;
    }
}
