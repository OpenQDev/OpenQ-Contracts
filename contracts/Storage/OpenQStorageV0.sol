// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';

// Custom
import '../Tokens/OpenQTokenWhitelist.sol';
import '../BountyFactory/BountyFactory.sol';
import '../Oracle/Oraclize.sol';

abstract contract OpenQStorageV0 is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    Oraclize
{
    BountyFactory public bountyFactory;
    OpenQTokenWhitelist public openQTokenWhitelist;
}
