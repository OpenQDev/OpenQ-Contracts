// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

/// @title Oraclize
/// @author OpenQ
/// @dev Restricts access for method calls to Oracle address
abstract contract Oraclize is OwnableUpgradeable {
    /*///////////////////////////////////////////////////////////////
                          INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    // Oracle address
    address private _oracle;

    // Event emitted on each oracle transfer
    event OracleTransferred(
        address indexed previousOracle,
        address indexed newOracle
    );

    /**
		Initializes contract with oracle address
		@param _initialOracle The initial oracle address
		 */
    function __Oraclize_init(address _initialOracle) internal onlyInitializing {
        _oracle = _initialOracle;
    }

    /*///////////////////////////////////////////////////////////////
                          TRANSACTIONS
    //////////////////////////////////////////////////////////////*/

    /**
		Transfers oracle of the contract to a new account (`newOracle`).
		Internal function without access restriction.
		 */
    function _transferOracle(address newOracle) internal virtual {
        address oldOracle = _oracle;
        _oracle = newOracle;
        emit OracleTransferred(oldOracle, newOracle);
    }

    /*///////////////////////////////////////////////////////////////
                          UTILITY
    //////////////////////////////////////////////////////////////*/

    /**
		Returns the address of _oracle
		 */
    function oracle() external view virtual returns (address) {
        return _oracle;
    }

    /**
		Modifier to restrict access of methods to _oracle address
		 */
    modifier onlyOracle() {
        require(
            _oracle == _msgSender(),
            'Oraclize: caller is not the current OpenQ Oracle'
        );
        _;
    }
}
