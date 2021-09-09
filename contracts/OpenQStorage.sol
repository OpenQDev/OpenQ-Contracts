// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

// This contract is a base for different modules,
// that can be passed on to new OpenQ versions.
contract OpenQStorage is Ownable {
    address public openq;

    modifier onlyOpenQ() {
        require(
            msg.sender == openq,
            'OpenQStorage: Only the current OpenQ version can use this function.'
        );
        _;
    }

    function setOpenQ(address _openq) public onlyOwner {
        openq = _openq;
    }
}
