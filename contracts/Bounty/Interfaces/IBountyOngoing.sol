// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBounty.sol';

interface IBountyOngoing is IBounty {
    function payoutTokenAddress() external returns (address);

    function payoutVolume() external returns (uint256);

    function claimantId(bytes32) external returns (bool);

    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external returns (address, uint256);

    function closeOngoing(address _closer) external;
}
