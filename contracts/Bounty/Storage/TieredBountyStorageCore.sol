// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/// @title TieredBountyStorageCore
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all TieredBountyStorageCore implementations
/// @dev Since this contract is deep in the bounty implementations' inheritance chain, no new methods can be added to it (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract TieredBountyStorageCore is BountyCore {
    uint256 public constant VERSION_1 = 1;

    /// @notice Integers in payoutSchedule must add up to 100
    /// @dev [0] is 1st place, [1] is 2nd, etc.
    uint256[] public payoutSchedule;
    mapping(address => uint256) public fundingTotals;
    mapping(uint256 => bool) public tierClaimed;

    // Tier associated with deposit
    mapping(bytes32 => uint256) public tier;

    bool[] public invoiceComplete;
    bool[] public supportingDocumentsComplete;
    string[] public tierWinners;
}
