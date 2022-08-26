// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Third party imports inherited by DepositManagerV1
 */
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

/**
 * @dev Custom imports inherited by DepositManagerV1
 */
import '../OpenQ/IOpenQ.sol';
import '../Tokens/OpenQTokenWhitelist.sol';
import '../Bounty/Implementations/BountyV1.sol';
import '../Library/Errors.sol';

/**
 * @title DepositManagerStorageV1
 * @dev Backwards compatible, append-only chain of storage contracts inherited by DepositManager implementations
 */
abstract contract DepositManagerStorageV1 is
    OwnableUpgradeable,
    UUPSUpgradeable,
    IOpenQ
{
    uint256 public constant VERSION_1 = 1;
    OpenQTokenWhitelist public openQTokenWhitelist;
}
