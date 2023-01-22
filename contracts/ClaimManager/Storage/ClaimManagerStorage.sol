// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @dev Third party imports inherited by ClaimManagerStorageV1
 */
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

/**
 * @dev Custom imports inherited by ClaimManagerStorageV1
 */
import '../Interfaces/IClaimManager.sol';
import '../../OpenQ/Interfaces/IOpenQ.sol';
import '../../Library/OpenQDefinitions.sol';
import '../../Oracle/Oraclize.sol';
import '../../Bounty/Interfaces/IBounty.sol';
import '../../Library/Errors.sol';
import '../../KYC/IKycValidity.sol';

/**
 * @title ClaimManagerStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by ClaimManager implementations
 */
abstract contract ClaimManagerStorageV1 is
    IClaimManager,
    Oraclize,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 public constant VERSION_1 = 1;
    address public openQ;
    IKycValidity public kyc;
}
