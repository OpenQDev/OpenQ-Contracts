// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '..//Interfaces/IDepositManager.sol';
import '../../TokenWhitelist/OpenQTokenWhitelist.sol';
import '../../Bounty/Interfaces/IBounty.sol';
import '../../Library/Errors.sol';

/// @title DepositManagerStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all DepositManager implementations
/// @dev Add new variables for upgrades in a new, derived abstract contract that inherits from the previous storage contract version (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract DepositManagerStorageV1 is
    IDepositManager,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public constant VERSION_1 = 1;
    address public openQTokenWhitelist;
    address public openQ;
}
