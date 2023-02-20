// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/// @title Oraclize
/// @author FlacoJones
/// @notice Restricts access for method calls to oracle address
abstract contract Oraclize is ContextUpgradeable {
    /// @notice Oracle address
    address internal _oracle;

    event OracleTransferred(
        address indexed previousOracle,
        address indexed newOracle
    );

    /// @notice Initializes child contract with _initialOracle. Only callabel during initialization.
    /// @param _initialOracle The initial oracle address
    function __Oraclize_init(address _initialOracle) internal onlyInitializing {
        _oracle = _initialOracle;
    }

    /// @notice Transfers oracle of the contract to a new account (`newOracle`).
    function _transferOracle(address newOracle) internal virtual {
        address oldOracle = _oracle;
        _oracle = newOracle;
        emit OracleTransferred(oldOracle, newOracle);
    }

    /// @notice Returns the address of _oracle
    function oracle() external view virtual returns (address) {
        return _oracle;
    }

    /// @notice Modifier to restrict access of methods to _oracle address
    modifier onlyOracle() {
        require(
            _oracle == _msgSender(),
            'Oraclize: caller is not the current OpenQ Oracle'
        );
        _;
    }
}
