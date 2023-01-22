// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBounty.sol';

interface IBountyTiered is IBounty {
    function setTierWinner(string memory _winner, uint256 _tier) external;

    function getInvoiceComplete() external view returns (bool[] memory);
}
