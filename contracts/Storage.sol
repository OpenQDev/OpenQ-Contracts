// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

contract SimpleStorage {
    string storedData;

    function set(string memory x) public {
        storedData = x;
    }

    function get() public view returns (string memory x) {
        return storedData;
    }
}
