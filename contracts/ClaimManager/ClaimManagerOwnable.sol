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
     * @dev Claim Manager address
     */
    address private _claimManager;

    /**
     * @dev Initializes child contract with _initialClaimManager. Only callabel during initialization.
     * @param _initialClaimManager The initial claim manager address
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
