// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/TieredBountyCore.sol';
import '../Storage/TieredBountyStorageCore.sol';

/**
 * @title BountyStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
 */
abstract contract TieredFixedBountyStorageV1 is
    TieredBountyStorageCore,
    TieredBountyCore
{
    address public payoutTokenAddress;
}
