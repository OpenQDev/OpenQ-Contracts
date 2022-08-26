// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/**
 * @title DepositManagerOwnable
 * @dev Restricts access for method calls to Deposit Manager address
 */
abstract contract DepositManagerOwnable is ContextUpgradeable {
    /**
     * INITIALIZATION
     */

    /**
     * @dev Deposit Manager address
     */
    address private _depositManager;

    /**
     * @dev Initializes child contract with _initialDepositManager. Only callabel during initialization.
     * @param _initialDepositManager The initial oracle address
     */
    function __DepositManagerOwnable_init(address _initialDepositManager)
        internal
        onlyInitializing
    {
        _depositManager = _initialDepositManager;
    }

    /**
     * TRANSACTIONS
     */

    /**
     * UTILITY
     */

    /**
     * @dev Returns the address of _depositManager
     */
    function depositManager() external view virtual returns (address) {
        return _depositManager;
    }

    /**
     * @dev Modifier to restrict access of methods to _depositManager address
     */
    modifier onlyDepositManager() {
        require(
            _depositManager == _msgSender(),
            'DepositManagerOwnable: caller is not the current OpenQ Deposit Manager'
        );
        _;
    }
}
