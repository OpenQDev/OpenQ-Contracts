// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/**
 * @title BountyStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
 */
abstract contract AtomicBountyStorageV1 is BountyCore {
    uint256 public constant VERSION_1 = 1;
    bool public invoiceComplete;
    bool public supportingDocumentsComplete;
}
