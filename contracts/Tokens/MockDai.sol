// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

// Third Party
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MockDai is ERC20 {
    address public admin;

    constructor() ERC20('Mock DAI', 'mDAI') {
        _mint(msg.sender, 10000 * 10**18);
        admin = msg.sender;
    }
}
