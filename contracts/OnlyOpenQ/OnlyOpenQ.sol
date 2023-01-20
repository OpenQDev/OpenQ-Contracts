// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/**
 * @title OnlyOpenQ
 * @dev Restricts access for method calls to OpenQProxy address
 */
abstract contract OnlyOpenQ is ContextUpgradeable {
    /**
     * INITIALIZATION
     */

    /**
     * @dev OpenQProxy address
     */
    address private _openQ;

    /**
     * @dev Initializes contract with OpenQProxy address
     * @param initalOpenQ The OpenQProxy address
     */
    function __OnlyOpenQ_init(address initalOpenQ) internal {
        _openQ = initalOpenQ;
    }

    /**
     * @dev Getter for the current OpenQProxy address
     */
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
