// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import './OpenQStorage.sol';

contract UserAddressStorage is OpenQStorage {
    mapping(string => address) public addresses;
    mapping(address => string) public userIdsByAddress;

    event UserAddressAddedEvent(string userId, address ethAddress);
    event UserAddressRemovedEvent(string userId, address ethAddress);

    function addUserAddress(string calldata _userId, address ethAddress)
        public
        onlyOpenQ
    {
        require(
            addresses[_userId] == address(0),
            'UserAddressStorage: An address with this name already exsits for this GitHub user.'
        );
        addresses[_userId] = ethAddress;
        userIdsByAddress[ethAddress] = _userId;

        emit UserAddressAddedEvent(_userId, ethAddress);
    }

    function deleteUserAddress(string calldata _userId, address _ethAddress)
        public
        onlyOpenQ
    {
        delete userIdsByAddress[_ethAddress];
        delete addresses[_userId];

        emit UserAddressRemovedEvent(_userId, addresses[_userId]);
    }
}
