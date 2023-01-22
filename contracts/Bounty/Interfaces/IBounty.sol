// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyAtomic.sol';
import './IBountyOngoing.sol';
import './IBountyTiered.sol';
import './IBountyTieredFixed.sol';

interface IBounty is
    IBountyAtomic,
    IBountyOngoing,
    IBountyTiered,
    IBountyTieredFixed
{
    function tierClaimed(uint256 _tier)
        external
        view
        override(IBountyTiered, IBountyTieredFixed)
        returns (bool);

    function setTierWinner(string memory _winner, uint256 _tier)
        external
        override(IBountyTiered, IBountyTieredFixed);

    function getInvoiceComplete()
        external
        view
        override(IBountyTiered, IBountyTieredFixed)
        returns (bool[] memory);
}
