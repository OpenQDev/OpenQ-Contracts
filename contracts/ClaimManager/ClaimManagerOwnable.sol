// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports
 */
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/**
 * @title ClaimManagerOwnable
 * @dev Restricts access for method calls to Oracle address
 */
abstract contract ClaimManagerOwnable is ContextUpgradeable {
    /**
     * INITIALIZATION
     */

    /**
     * @dev Oracle address
     */
    address private _claimManager;

    /**
     * @dev Oracle address
     */
    event OracleTransferred(
        address indexed previousClaimManager,
        address indexed newClaimManager
    );

    /**
     * @dev Initializes child contract with _initialClaimManager. Only callabel during initialization.
     * @param _initialClaimManager The initial oracle address
     */
    function __ClaimManagerOwnable_init(address _initialClaimManager)
        internal
        onlyInitializing
    {
        _claimManager = _initialClaimManager;
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Transfers oracle of the contract to a new account (`newClaimManager`).
     * @dev Internal function without access restriction.
     */
    function _transferOracle(address newClaimManager) internal virtual {
        address oldClaimManager = _claimManager;
        _claimManager = newClaimManager;
        emit OracleTransferred(oldClaimManager, newClaimManager);
    }

    /**
     * UTILITY
     */

    /**
     * @dev Returns the address of _claimManager
     */
    function claimManager() external view virtual returns (address) {
        return _claimManager;
    }

    /**
     * @dev Modifier to restrict access of methods to _claimManager address
     */
    modifier onlyClaimManager() {
        require(
            _claimManager == _msgSender(),
            'ClaimManagerOwnable: caller is not the current OpenQ Claim Manager'
        );
        _;
    }
}
