// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract OpenQOwnable is Ownable {
    address public openQ;

    modifier onlyOpenQ() {
        require(
            msg.sender == openQ,
            'Only the current OpenQ version can use this function'
        );
        _;
    }

    function setOpenQ(address _openQ) public onlyOwner {
        openQ = _openQ;
    }
}
