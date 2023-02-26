// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/// @title DepositManagerOwnable
/// @notice Restricts access for method calls to Deposit Manager address
abstract contract DepositManagerOwnable is ContextUpgradeable {
    /// @notice Deposit Manager address
    address private _depositManager;

    /// @notice Initializes child contract with _initialDepositManager. Only callabel during initialization.
    /// @param _initialDepositManager The initial oracle address
    function __DepositManagerOwnable_init(address _initialDepositManager)
        internal
        onlyInitializing
    {
        _depositManager = _initialDepositManager;
    }

    /// @notice Returns the address of _depositManager
    function depositManager() external view virtual returns (address) {
        return _depositManager;
    }

    /// @notice Modifier to restrict access of methods to _depositManager address
    modifier onlyDepositManager() {
        require(
            _depositManager == _msgSender(),
            'DepositManagerOwnable: caller is not the current OpenQ Deposit Manager'
        );
        _;
    }

    uint256[50] private __gap;
}
