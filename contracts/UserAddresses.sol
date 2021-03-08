// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

// This contract acts as Octobay's user storage.
contract UserAddresses {
  address owner; // can change client
  address client; // can change data

  // GitHub user's eth addresses
  // A user can have multiple (named) addresses.
  // GitHub GraphQL ID => (name => address)
  mapping(string => mapping(string => address)) public addresses;
  mapping(address => string) public userIdsByAddress;

  // allow only current client
  modifier onlyClient() {
    require(msg.sender == client, 'Only client can use this function.');
    _;
  }

  constructor() public {
    owner = msg.sender;
  }

  // update current client
  function changeClient(address _client) public {
    require(msg.sender == owner, 'Only owner can update client.');
    client = _client;
  }

  function addUserAddress(
    string calldata _userId,
    string calldata _addressName,
    address _address
  ) public onlyClient {
    addresses[_userId][_addressName] = _address;
    userIdsByAddress[_address] = _userId;
  }

  function deleteUserAddress(
    string calldata _userId,
    string calldata _addressName
  ) public onlyClient {
    delete userIdsByAddress[addresses[_userId][_addressName]];
    delete addresses[_userId][_addressName];
  }
}