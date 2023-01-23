// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyTiered is IBountyCore {
    // GETTERS
    function tierClaimed(uint256 _tier) external view returns (bool);

    function getInvoiceComplete() external view returns (bool[] memory);

    function tierWinners(uint256) external view returns (string memory);

    function invoiceComplete(uint256) external view returns (bool);

    function supportingDocumentsComplete(uint256) external view returns (bool);

    // SETTERS
    function setTierWinner(string memory _winner, uint256 _tier) external;

    function setPayoutSchedule(uint256[] calldata _payoutSchedule) external;

    function closeCompetition() external;

    function setTierClaimed(uint256 _tier) external;

    function claimTiered(
        address _payoutAddress,
        uint256 _tier,
        address _tokenAddress
    ) external returns (uint256);

    function tier(bytes32) external view returns (uint256);

    function getPayoutSchedule() external view returns (uint256[] memory);

    function getTierWinners() external view returns (string[] memory);
}
