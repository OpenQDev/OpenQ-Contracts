// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import './OpenQV0.sol';

/**
How to account for two types of additions:

1. Inheriting from a new base contract on the new version of OpenQ
2. Adding new custom storage variables to OpenQStorage

 */

contract NewBaseContract {
    uint256 public foo = 123;
}

contract OpenQStorageV1 {
    uint256 public newStorageVar = 456;
}

contract OpenQV1 is OpenQV0, OpenQStorageV1, NewBaseContract {}
