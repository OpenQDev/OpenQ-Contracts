// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayClient.sol';

// This contract acts as Octobay's user storage.
contract UserAddresses is OctobayClient {
  // GitHub user's eth addresses
  // A user can have multiple (named) addresses.
  // GitHub GraphQL ID => (name => address)
  mapping(string => mapping(string => address)) public addresses;
  mapping(address => string) public userIdsByAddress;

  event UserAddressAddedEvent(string userId, string addressName, address ethAddress);
  event UserAddressRemovedEvent(string userId, string addressName, address ethAddress);

  function addUserAddress(
    string calldata _userId,
    string calldata _addressName,
    address _address
  ) public onlyOctobayClient {
    addresses[_userId][_addressName] = _address;
    userIdsByAddress[_address] = _userId;

    emit UserAddressAddedEvent(
      _userId,
      _addressName,
      _address
    );
  }

  function deleteUserAddress(
    string calldata _userId,
    string calldata _addressName
  ) public onlyOctobayClient {
    emit UserAddressAddedEvent(
      _userId,
      _addressName,
      addresses[_userId][_addressName]
    );

    delete userIdsByAddress[addresses[_userId][_addressName]];
    delete addresses[_userId][_addressName];
  }
}