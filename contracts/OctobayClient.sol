// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

// This contract is a base for different modules,
// that can be passed on to new Octobay versions.
contract OctobayClient is Ownable {
  
  // the contract that can change the module's data
  address octobayClient;

  // allow only current client
  modifier onlyOctobayClient() {
    require(msg.sender == octobayClient, 'Only the current client can use this function.');
    _;
  }

  // change current client
  function changeOctobayClient(address _client) onlyOwner public {
    octobayClient = _client;
  }

}