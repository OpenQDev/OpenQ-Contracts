// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../Storage/OpenQStorage.sol';
import '../OpenQ/OpenQStorable.sol';

contract OpenQProxy is ERC1967Proxy, Ownable {
    constructor(address _logic, bytes memory _data)
        ERC1967Proxy(_logic, _data)
    {}

    function upgradeTo(address newImplementation) external onlyOwner {
        _upgradeTo(newImplementation);
    }
}
