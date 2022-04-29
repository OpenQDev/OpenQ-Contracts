// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol';

// Custom
import '../OnlyOpenQ/OnlyOpenQ.sol';

/// @title BountyStorageV0
/// @author OpenQ
/// @dev Backwards compatible, append-only chain of storage contracts inherited by Bounty implementations
abstract contract BountyStorageV0 is
    ReentrancyGuardUpgradeable,
    IERC721ReceiverUpgradeable,
    OnlyOpenQ
{
    // Bounty data
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    address public issuer;
    string public organization;
    address public closer;
    uint256 public status;
    uint256 public nftDepositLimit;

    // Deconstructed deposit struct
    mapping(bytes32 => address) public funder;
    mapping(bytes32 => address) public tokenAddress;
    mapping(bytes32 => uint256) public volume;
    mapping(bytes32 => uint256) public depositTime;
    mapping(bytes32 => bool) public refunded;
    mapping(bytes32 => address) public payoutAddress;
    mapping(bytes32 => uint256) public tokenId;
    mapping(bytes32 => uint256) public expiration;
    mapping(bytes32 => bool) public isNFT;

    // Array of depositIds
    bytes32[] public deposits;
    bytes32[] public nftDeposits;

    // Set of unique token address
    EnumerableSetUpgradeable.AddressSet internal tokenAddresses;
}

/*///////////////////////////////////////////////////////////////
											UPGRADE DUMMIES
//////////////////////////////////////////////////////////////*/

abstract contract BountyStorageV1 is BountyStorageV0 {
    uint256 public newFoo;
}
