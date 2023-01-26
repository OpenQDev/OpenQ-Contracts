// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/// @title OngoingBountyStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all OngoingBountyStorage implementations
/// @dev Add new variables for upgrades in a new, derived abstract contract that inherits from the previous storage contract version (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract OngoingBountyStorageV1 is BountyCore {
    uint256 public constant VERSION_1 = 1;

    /// @notice Ongoing Bounties pay out the same amount set by the minter for each submission.
    /// @dev Only closed once minter explicitly closes
    address public payoutTokenAddress;
    uint256 public payoutVolume;

    /// @dev keccak256 hash of the claimant ID (GitHub ID) with the claimant asset ID (GitHub PR ID)
    mapping(bytes32 => bool) public claimId;

    // Keys of claims, can be used off-chain as an iterable to determine completed payouts
    bytes32[] public claimIds;

    mapping(bytes32 => bool) public invoiceComplete;
    mapping(bytes32 => bool) public supportingDocumentsComplete;
}
