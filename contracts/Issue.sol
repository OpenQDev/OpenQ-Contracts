// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Issue {
    string id;
    address owner;
    address mockTokenAddress;

    constructor(string memory _id) {
        id = _id;
        owner = msg.sender;
    }

    function getMockBalance() public returns (uint256 balance) {
        ERC20 mockTokenContract = ERC20(mockTokenAddress);
        return mockTokenContract.balanceOf(address(this));
    }

    function setMockTokenAddress(address _mockTokenAddress) public {
        mockTokenAddress = _mockTokenAddress;
    }

    function withdraw(address payoutAddress) public {}
}
