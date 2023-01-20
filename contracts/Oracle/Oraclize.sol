// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/**
 * @title Oraclize
 * @dev Restricts access for method calls to Oracle address
 */
abstract contract Oraclize is ContextUpgradeable {
    /**
     * INITIALIZATION
     */

    /**
     * @dev Oracle address
     */
    address private _oracle;

    /**
     * @dev Oracle address
     */
    event OracleTransferred(
        address indexed previousOracle,
        address indexed newOracle
    );

    /**
     * @dev Initializes child contract with _initialOracle. Only callabel during initialization.
     * @param _initialOracle The initial oracle address
     */
    function __Oraclize_init(address _initialOracle) internal onlyInitializing {
        _oracle = _initialOracle;
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Transfers oracle of the contract to a new account (`newOracle`).
     * @dev Internal function without access restriction.
     */
    function _transferOracle(address newOracle) internal virtual {
        address oldOracle = _oracle;
        _oracle = newOracle;
        emit OracleTransferred(oldOracle, newOracle);
    }

    /**
     * UTILITY
     */

    /**
     * @dev Returns the address of _oracle
     */
    function oracle() external view virtual returns (address) {
        return _oracle;
    }

    /**
     * @dev Modifier to restrict access of methods to _oracle address
     */
    modifier onlyOracle() {
        require(
            _oracle == _msgSender(),
            'Oraclize: caller is not the current OpenQ Oracle'
        );
        _;
    }
}
