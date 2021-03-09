// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

// This contract is a base for different modules,
// that can be passed on to new Octobay versions.
contract Module is Ownable {
  
  // the contract that can change the module's data
  address client;

  // allow only current client
  modifier onlyClient() {
    require(msg.sender == client, 'Only the current client can use this function.');
    _;
  }

  // change current client
  function changeClient(address _client) onlyOwner public {
    client = _client;
  }

}