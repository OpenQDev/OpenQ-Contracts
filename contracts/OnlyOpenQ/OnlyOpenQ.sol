// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/// @title OnlyOpenQ
/// @author FlacoJones
/// @notice Ownable-style contract to restrict access for method calls exclusively to the OpenQProxy address
abstract contract OnlyOpenQ is ContextUpgradeable {
    /// @notice OpenQProxy address
    address private _openQ;

    /// @notice Initializes contract with OpenQProxy address
    /// @param _initalOpenQ The OpenQProxy address
    function __OnlyOpenQ_init(address _initalOpenQ) internal {
        _openQ = _initalOpenQ;
    }

    /// @notice Getter for the current OpenQProxy address
    function openQ() public view returns (address) {
        return _openQ;
    }

    /**
     * @dev Modifier to restrict access of methods to OpenQProxy address
     */
    modifier onlyOpenQ() {
        require(_msgSender() == _openQ, 'Method is only callable by OpenQ');
        _;
    }
}
