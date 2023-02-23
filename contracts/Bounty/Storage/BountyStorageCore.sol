// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '../../OnlyOpenQ/OnlyOpenQ.sol';
import '../../ClaimManager/ClaimManagerOwnable.sol';
import '../../DepositManager/DepositManagerOwnable.sol';
import '../../Library/OpenQDefinitions.sol';
import '../../Library/Errors.sol';

import '../Interfaces/IBountyCore.sol';

/// @title BountyStorageCore
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all (Type)BountyStorage implementations
/// @dev Since this contract is deep in the bounty implementations' inheritance chain, no new methods can be added to it (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract BountyStorageCore is
    IBountyCore,
    ReentrancyGuardUpgradeable,
    ERC721HolderUpgradeable,
    OnlyOpenQ,
    ClaimManagerOwnable,
    DepositManagerOwnable
{
    /// @notice Bounty data
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    address public issuer;
    string public organization;
    address public closer;
    uint256 public status;
    uint256 public nftDepositLimit;

    /// @notice Deconstructed deposit struct
    mapping(bytes32 => address) public funder;
    mapping(bytes32 => address) public tokenAddress;
    mapping(bytes32 => uint256) public volume;
    mapping(bytes32 => uint256) public depositTime;
    mapping(bytes32 => bool) public refunded;
    mapping(bytes32 => address) public payoutAddress;
    mapping(bytes32 => uint256) public tokenId;
    mapping(bytes32 => uint256) public expiration;

    /// @notice Array of depositIds
    bytes32[] public deposits;

    /// @notice Array of claim amounts
    uint256 public volumeClaimed;

    /// @notice Set of unique token address
    EnumerableSetUpgradeable.AddressSet internal tokenAddresses;

    /// @notice Data related to the closer of this bounty
    bytes public closerData;

    /// @notice The class/type of bounty (Single, Ongoing, or Tiered)
    /// @dev type is a reserved word in Solidity
    uint256 public bountyType;

    bool public hasFundingGoal;
    address public fundingToken;
    uint256 public fundingGoal;
    bool public invoiceRequired;
    bool public kycRequired;
    bool public supportingDocumentsRequired;
    string public issuerExternalUserId;
}
