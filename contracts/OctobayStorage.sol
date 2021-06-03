// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

// This contract is a base for different modules,
// that can be passed on to new Octobay versions.
contract OctobayStorage is Ownable {

  address public octobay;

  modifier onlyOctobay() {
    require(msg.sender == octobay, 'OctobayStorage: Only the current octobay version can use this function.');
    _;
  }

  function setOctobay(address _octobay) onlyOwner public {
    octobay = _octobay;
  }

}