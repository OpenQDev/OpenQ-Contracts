// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBounty.sol';

interface IBountyTieredFixed is IBounty {
    function setTierWinner(string memory _winner, uint256 _tier) external;

    function tierClaimed(uint256 _tier) external returns (bool);

    function getInvoiceComplete() external view returns (bool[] memory);
}
