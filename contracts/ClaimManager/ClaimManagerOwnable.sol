// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/// @title ClaimManagerOwnable
/// @author FlacoJones
/// @notice Restricts access for method calls to Oracle address
abstract contract ClaimManagerOwnable is ContextUpgradeable {
    /// INITIALIZATION

    /// @notice ClaimManagerProxy address
    address private _claimManager;

    /// @notice Initializes child contract with _initialClaimManager. Only callabel during initialization.
    /// @param _initialClaimManager The initial claim manager address
    function __ClaimManagerOwnable_init(address _initialClaimManager)
        internal
        onlyInitializing
    {
        _claimManager = _initialClaimManager;
    }

    /// @notice Returns the address of _claimManager
    function claimManager() external view virtual returns (address) {
        return _claimManager;
    }

    /// @notice Modifier to restrict access of methods to _claimManager address
    modifier onlyClaimManager() {
        require(
            _claimManager == _msgSender(),
            'ClaimManagerOwnable: caller is not the current OpenQ Claim Manager'
        );
        _;
    }

    uint256[50] private __gap;
}
