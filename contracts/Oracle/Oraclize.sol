// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

abstract contract Oraclize is OwnableUpgradeable {
    address private _oracle;

    event OracleTransferred(
        address indexed previousOracle,
        address indexed newOracle
    );

    function __Oraclize_init(address oracle) internal onlyInitializing {
        _oracle = oracle;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function oracle() public view virtual returns (address) {
        return _oracle;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOracle() {
        require(
            _oracle == _msgSender(),
            'Oraclize: caller is not the current OpenQ Oracle'
        );
        _;
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOracle(address newOracle) internal virtual {
        address oldOracle = _oracle;
        _oracle = newOracle;
        emit OracleTransferred(oldOracle, newOracle);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOracle(address newOracle) public virtual onlyOwner {
        require(
            newOracle != address(0),
            'Ownable: new owner is the zero address'
        );
        _transferOracle(newOracle);
    }
}
