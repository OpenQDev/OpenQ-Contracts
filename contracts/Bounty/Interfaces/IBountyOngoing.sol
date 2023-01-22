// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyOngoing is IBountyCore {
    function payoutTokenAddress() external returns (address);

    function payoutVolume() external returns (uint256);

    function claimantId(bytes32) external returns (bool);

    function setPayout(address, uint256) external;

    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external returns (address, uint256);

    function closeOngoing(address _closer) external;
}
