// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';

// Custom
import '../OpenQ/OpenQStorable.sol';

contract OpenQProxy is OpenQStorable, ERC1967Proxy, UUPSUpgradeable, Ownable {
    constructor(address _logic, bytes memory _data)
        ERC1967Proxy(_logic, _data)
    {}

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {
        _upgradeTo(newImplementation);
    }
}
