// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../Interfaces/IClaimManager.sol';
import '../../OpenQ/Interfaces/IOpenQ.sol';
import '../../Library/OpenQDefinitions.sol';
import '../../Oracle/Oraclize.sol';
import '../../Bounty/Interfaces/IBounty.sol';
import '../../Library/Errors.sol';
import '../../KYC/IKycValidity.sol';

/// @title ClaimManagerStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all ClaimManager implementations
/// @dev Add new variables for upgrades in a new, derived abstract contract that inherits from the previous storage contract version (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract ClaimManagerStorageV1 is
    IClaimManager,
    Oraclize,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public constant VERSION_1 = 1;
    address public openQ;
    address public kyc;

    uint256[50] private __gap;
}
