// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/**
 * @title BountyStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
 */
abstract contract TieredBountyStorageV1 {
    uint256 public constant VERSION_1 = 1;
    /**
     * @dev Integers in payoutSchedule must add up to 100
     * @dev [0] is 1st place, [1] is 2nd, etc.
     */
    uint256[] public payoutSchedule;
    mapping(address => uint256) public fundingTotals;
    mapping(uint256 => bool) public tierClaimed;

    // Tier associated with deposit
    mapping(bytes32 => uint256) public tier;

    bool[] public invoiceComplete;
    bool[] public supportingDocumentsComplete;
    string[] public tierWinners;
}
