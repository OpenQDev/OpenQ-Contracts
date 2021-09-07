// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import './OpenQStorage.sol';

contract UserAddressStorage is OpenQStorage {
    mapping(string => address) public addresses;
    mapping(address => string) public userIdsByAddress;

    event UserAddressAddedEvent(string userId, address ethAddress);

    function registerUserAddress(string calldata _userId, address ethAddress)
        public
        onlyOpenQ
    {
        addresses[_userId] = ethAddress;
        userIdsByAddress[ethAddress] = _userId;

        emit UserAddressAddedEvent(_userId, ethAddress);
    }
}
