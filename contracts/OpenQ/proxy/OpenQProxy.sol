// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';

/// @title OpenQProxy
/// @author FlacoJones
/// @notice ERC1967Proxy through which all OpenQ transactions pass through
contract OpenQProxy is ERC1967Proxy {
    /// @notice ERC1967Proxy constructor
    /// @param _logic The deployed implementation contract to send all delegatecall to
    /// @param _data Additional data to pass to initialize method (an empty byte array in the case of OpenQ)
    constructor(address _logic, bytes memory _data)
        payable
        ERC1967Proxy(_logic, _data)
    {}
}
