// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/proxy/Proxy.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../Storage/OpenQStorage.sol';
import '../OpenQ/OpenQStorable.sol';

contract OpenQProxy is OpenQStorable, Proxy, Ownable {
    address private _openQImplementation;

    function _implementation()
        internal
        view
        override
        returns (address implementation)
    {
        return _openQImplementation;
    }

    function setOpenQStorage(address _openQStorage) public override {
        openQStorage = OpenQStorage(_openQStorage);
    }

    function setOpenQImplementation(address _implementation) public onlyOwner {
        _openQImplementation = _implementation;
    }
}
