// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

// Third Party

// V0
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';

// Custom

// V0
import '../BountyFactory/BountyFactory.sol';
import '../Tokens/OpenQTokenWhitelist.sol';
import '../Bounty/Implementations/BountyV0.sol';
import '../Oracle/Oraclize.sol';

/// @title OpenQStorageV0
/// @author OpenQ
/// @dev Backwards compatible, append-only chain of storage contracts inherited by OpenQ implementations
abstract contract OpenQStorageV0 is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    Oraclize
{
    BountyFactory public bountyFactory;
    OpenQTokenWhitelist public openQTokenWhitelist;
    mapping(string => address) public bountyIdToAddress;
}

/*///////////////////////////////////////////////////////////////
											UPGRADE DUMMIES
//////////////////////////////////////////////////////////////*/

contract NewBaseContract {
    uint256 public foo;

    function setFoo(uint256 _foo) public {
        foo = _foo;
    }
}

abstract contract OpenQStorageV1 is OpenQStorageV0, NewBaseContract {
    uint256 public newStorageVar;
}
