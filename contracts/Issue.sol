// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import './OpenQ.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Issue {
    string public id;
    address public owner;
    address[] public tokenAddresses;

    constructor(string memory _id, address[] memory _tokenAddresses) {
        id = _id;
        owner = msg.sender;
        tokenAddresses = _tokenAddresses;
    }

    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        ERC20 tokenAddress = ERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function transferAllERC20(address _payoutAddress) public {
        require(msg.sender == owner, 'Only callable by OpenQ contract');

        for (uint256 i; i < tokenAddresses.length; i++) {
            ERC20 tokenContract = ERC20(tokenAddresses[i]);
            tokenContract.transfer(
                _payoutAddress,
                tokenContract.balanceOf(address(this))
            );
        }
    }
}