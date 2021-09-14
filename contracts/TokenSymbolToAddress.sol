// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TokenSymbolToAddress {
    mapping(string => address) public tokenSymbolToAddress;

    function addSymbolToAddress(address tokenAddress) public {
        ERC20 tokenContract = ERC20(tokenAddress);
        string memory symbol = tokenContract.symbol();
        tokenSymbolToAddress[symbol] = tokenAddress;
    }
}
