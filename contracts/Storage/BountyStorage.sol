// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports inherited by BountyV0
 */
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

/**
 * @dev Custom imports inherited by BountyV0
 */
import '../OnlyOpenQ/OnlyOpenQ.sol';
import '../ClaimManager/ClaimManagerOwnable.sol';
import '../DepositManager/DepositManagerOwnable.sol';
import '../Library/OpenQDefinitions.sol';
import '../Library/Errors.sol';

/**
 * @title BountyStorageV0
 * @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
 */
abstract contract BountyStorageV0 is
    ReentrancyGuardUpgradeable,
    ERC721HolderUpgradeable,
    OnlyOpenQ,
    ClaimManagerOwnable,
    DepositManagerOwnable
{
    /**
     * @dev Bounty data
     */
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    address public issuer;
    string public organization;
    address public closer;
    uint256 public status;
    uint256 public nftDepositLimit;

    /**
     * @dev Deconstructed deposit struct
     */
    mapping(bytes32 => address) public funder;
    mapping(bytes32 => address) public tokenAddress;
    mapping(bytes32 => uint256) public volume;
    mapping(bytes32 => uint256) public depositTime;
    mapping(bytes32 => bool) public refunded;
    mapping(bytes32 => address) public payoutAddress;
    mapping(bytes32 => uint256) public tokenId;
    mapping(bytes32 => uint256) public expiration;
    mapping(bytes32 => bool) public isNFT;
    mapping(bytes32 => uint256) public tier;

    /**
     * @dev Array of depositIds
     */
    bytes32[] public deposits;
    bytes32[] public nftDeposits;

    /**
     * @dev Set of unique token address
     */
    EnumerableSetUpgradeable.AddressSet internal tokenAddresses;

    /**
     * @dev Data related to the closer of this bounty
     */
    bytes public closerData;
}

abstract contract BountyStorageV1 is BountyStorageV0 {
    /**
    The class/type of bounty (Single, Ongoing, or Tiered)
    type is a reserved word in Solidity
		 */
    uint256 public bountyType;

    /** 
      Ongoing Bounties pay out the same amount set by the minter for each submission.
      Only closed once minter explicitly closes
    */
    address public payoutTokenAddress;
    uint256 public payoutVolume;

    // keccak256 hash of the claimant ID (GitHub ID) with the claimant asset ID (GitHub PR ID)
    mapping(bytes32 => bool) public claimantId;

    /**
     * @dev Integers in payoutSchedule must add up to 100
     * @dev [0] is 1st place, [1] is 2nd, etc.
     */
    uint256[] public payoutSchedule;
    mapping(address => uint256) public fundingTotals;
    mapping(uint256 => bool) public tierClaimed;

    bool public hasFundingGoal;
    address public fundingToken;
    uint256 public fundingGoal;
}

abstract contract BountyStorageV2 is BountyStorageV1 {
	bool public invoiceable;
	bool public kycRequired;
}