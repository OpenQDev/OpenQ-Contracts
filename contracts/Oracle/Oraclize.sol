// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

abstract contract Oraclize is OwnableUpgradeable {
    address private _oracle;

    event OracleTransferred(
        address indexed previousOracle,
        address indexed newOracle
    );

    function __Oraclize_init(address _newOracle) internal onlyInitializing {
        _oracle = _newOracle;
    }

    /**
     * @dev Returns the address of the current oracle.
     */
    function oracle() external view virtual returns (address) {
        return _oracle;
    }

    /**
     * @dev Throws if called by any account other than the oracle.
     */
    modifier onlyOracle() {
        require(
            _oracle == _msgSender(),
            'Oraclize: caller is not the current OpenQ Oracle'
        );
        _;
    }

    /**
     * @dev Transfers oracle of the contract to a new account (`newOracle`).
     * Internal function without access restriction.
     */
    function _transferOracle(address newOracle) internal virtual {
        address oldOracle = _oracle;
        _oracle = newOracle;
        emit OracleTransferred(oldOracle, newOracle);
    }

    /**
     * @dev Transfers oracle of the contract to a new account (`newOracle`).
     * Can only be called by the current owner.
     */
    function transferOracle(address newOracle) external virtual onlyOwner {
        require(
            newOracle != address(0),
            'Oraclize: new oracle is the zero address'
        );
        _transferOracle(newOracle);
    }
}
