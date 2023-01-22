// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyTiered is IBountyCore {
    // GETTERS
    function tierClaimed(uint256 _tier) external view returns (bool);

    function getInvoiceComplete() external view returns (bool[] memory);

    // SETTERS
    function setTierWinner(string memory _winner, uint256 _tier) external;

    function setPayoutSchedule(uint256[] calldata _payoutSchedule) external;
}
