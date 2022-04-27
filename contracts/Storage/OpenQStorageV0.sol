// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '../BountyFactory/BountyFactory.sol';
import '../Tokens/OpenQTokenWhitelist.sol';

contract OpenQStorageV0 {
    BountyFactory public bountyFactory;
    OpenQTokenWhitelist public openQTokenWhitelist;
}
