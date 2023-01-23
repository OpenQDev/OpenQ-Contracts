// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../../BountyFactory/BountyFactory.sol';
import '../../Library/OpenQDefinitions.sol';
import '../../Library/Errors.sol';
import '../../OpenQ/Interfaces/IOpenQ.sol';
import '../../Oracle/Oraclize.sol';

import '../../Bounty/Interfaces/IBounty.sol';

/// @title OpenQStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by OpenQ implementations
/// @dev See (https://github.com/compound-finance/compound-protocol/blob/master/contracts/ComptrollerStorage.sol) for example
/// @dev See (https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069) for explanation
abstract contract OpenQStorageV1 is
    IOpenQ,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    Oraclize
{
    uint256 public constant VERSION_1 = 1;
    BountyFactory public bountyFactory;
    address public claimManager;
    address public depositManager;
    mapping(string => address) public bountyIdToAddress;
    mapping(string => address) public externalUserIdToAddress;
    mapping(address => string) public addressToExternalUserId;
}
