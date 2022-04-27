// // SPDX-License-Identifier: BUSL-1.1
// pragma solidity 0.8.12;

// import './OpenQStorageV0.sol';

// // Inherit all things onto an abstract contract
// abstract contract OpenQStorageV0 is
//     OwnableUpgradeable,
//     UUPSUpgradeable,
//     ReentrancyGuardUpgradeable,
//     Oraclize
// {
//     BountyFactory public bountyFactory;
//     OpenQTokenWhitelist public openQTokenWhitelist;
// }

// // Inherit the abstract contract onto your main implementation
// contract OpenQV0 is OpenQStorageV0 {...}

// // ----- LATER -----

// // Later, there's a New Base Contract you want to inherit
// contract NewBaseContract {
//     uint256 public foo;

//     function setFoo(uint256 _foo) public {
//         foo = _foo;
//     }
// }

// // Inherit the old storage, then inherit from New Base Contract, then add any new custom storage variables
// // This maintains the storage order from before, UNLESS there are dependency interactions between NewBaseContract and the old ones
// abstract contract OpenQStorageV1 is OpenQStorageV0, NewBaseContract {
//     uint256 public newStorageVar = 456;
// }

// // Inherit the newer abstract contract onto your main implementation
// contract OpenQV1 is OpenQStorageV1 {...}