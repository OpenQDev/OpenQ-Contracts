// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import './OpenQV0.sol';

/**
How to account for two types of additions:

1. Inheriting from a new base contract on the new version of OpenQ
2. Adding new custom storage variables to OpenQStorage

 */

// Upgrade 1
contract NewBaseContract {
    uint256 public foo;

    function setFoo(uint256 _foo) public {
        foo = _foo;
    }
}

contract OpenQStorageV1 {
    uint256 public newStorageVar = 456;

    function setNewStorageVar(uint256 _newStorageVar) public {
        newStorageVar = _newStorageVar;
    }
}

// Upgrade 2
contract AirnodeBaseContract {
    uint256 public newerFoo = 789;

    function setNewerFoo(uint256 _newerFoo) public {
        newerFoo = _newerFoo;
    }
}

contract OpenQStorageV2 {
    uint256 public newerStorageVar;

    function setNewerStorageVar(uint256 _newerStorageVar) public {
        newerStorageVar = _newerStorageVar;
    }
}

contract OpenQV1 is OpenQV0, OpenQStorageV1, NewBaseContract {}

contract OpenQV2 is OpenQV1, OpenQStorageV2, AirnodeBaseContract {}
