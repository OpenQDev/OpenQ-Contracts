// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Issue {
    string id;
    address owner;
    address tokenSymbolToAddressLibrary;

    address[] public tokenAddresses;

    constructor(string memory _id) {
        id = _id;
        owner = msg.sender;
    }

    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        ERC20 tokenAddress = ERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function addTokenAddress(address tokenAddress) public {
        tokenAddresses.push(tokenAddress);
    }

    function transferAllERC20(address _payoutAddress) public {
        for (uint256 i; i < tokenAddresses.length; i++) {
            ERC20 tokenContract = ERC20(tokenAddresses[i]);
            tokenContract.transfer(
                _payoutAddress,
                tokenContract.balanceOf(address(this))
            );
        }
    }
}
