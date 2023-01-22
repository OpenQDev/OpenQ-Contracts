// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/BountyCore.sol';

/**
 * @title OngoingBountyStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
 */
abstract contract OngoingBountyStorageV1 is BountyCore {
    uint256 public constant VERSION_1 = 1;

    /** 
      Ongoing Bounties pay out the same amount set by the minter for each submission.
      Only closed once minter explicitly closes
    */
    address public payoutTokenAddress;
    uint256 public payoutVolume;

    // keccak256 hash of the claimant ID (GitHub ID) with the claimant asset ID (GitHub PR ID)
    mapping(bytes32 => bool) public claimantId;

    mapping(string => bool) public invoiceComplete;
    mapping(string => bool) public supportingDocumentsComplete;
}
