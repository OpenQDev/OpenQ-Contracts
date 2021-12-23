// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/proxy/Proxy.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract OpenQProxy is Proxy, Ownable {
    // Properties
    mapping(string => address) public bountyIdToAddress;
    mapping(address => string) public bountyAddressToBountyId;

    address private _OpenQImplementation;

    function _implementation()
        internal
        view
        override
        returns (address implementation)
    {
        return _OpenQImplementation;
    }

    function setOpenQImplementation(address implementation) public onlyOwner {
        _OpenQImplementation = implementation;
    }
}
