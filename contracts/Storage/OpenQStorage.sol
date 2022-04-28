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
import '../Bounty/Implementations/BountyV0.sol';
import '../BountyFactory/BountyFactory.sol';
import '../Tokens/OpenQTokenWhitelist.sol';

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

contract NewBaseContract {
    uint256 public foo;

    function setFoo(uint256 _foo) public {
        foo = _foo;
    }
}

abstract contract OpenQStorageV1 is OpenQStorageV0, NewBaseContract {
    uint256 public newStorageVar;
}
