// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import '../OpenQ/OpenQStorable.sol';

contract OpenQProxy is OpenQStorable, ERC1967Proxy, UUPSUpgradeable, Ownable {
    constructor(address _logic, bytes memory _data)
        ERC1967Proxy(_logic, _data)
    {}

		function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
			_upgradeTo(newImplementation);
		}
}
