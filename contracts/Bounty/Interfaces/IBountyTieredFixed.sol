// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyTieredFixed is IBountyCore {
    // GETTERS
    function tierClaimed(uint256 _tier) external view returns (bool);

    function getInvoiceComplete() external view returns (bool[] memory);

    function getTierWinners() external returns (string[] memory);

    // SETTERS
    function setTierWinner(string memory _winner, uint256 _tier) external;

    function setPayoutScheduleFixed(
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external;
}
