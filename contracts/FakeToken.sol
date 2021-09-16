// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract FakeToken is ERC20 {
    address public admin;

    constructor() ERC20('Fake', 'FAKE') {
        _mint(msg.sender, 10000 * 10**18);
        admin = msg.sender;
    }
}
