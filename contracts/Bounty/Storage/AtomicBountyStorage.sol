// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/// @title AtomicBountyStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all AtomicBountyStorage implementations
/// @dev Add new variables for upgrades in a new, derived abstract contract that inherits from the previous storage contract version (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract AtomicBountyStorageV1 is BountyCore {
    uint256 public constant VERSION_1 = 1;
    bool public invoiceComplete;
    bool public supportingDocumentsComplete;
}
