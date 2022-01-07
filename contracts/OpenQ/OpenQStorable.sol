// contracts/OpenQ.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../Storage/OpenQStorage.sol';
import '../BountyFactory/BountyFactory.sol';

abstract contract OpenQStorable {
    OpenQStorage public openQStorage;
    BountyFactory public bountyFactory;

    function setOpenQStorage(address _openQStorage) public {
        openQStorage = OpenQStorage(_openQStorage);
    }

    function setBountyFactory(address _bountyFactory) public {
        bountyFactory = BountyFactory(_bountyFactory);
    }
}
