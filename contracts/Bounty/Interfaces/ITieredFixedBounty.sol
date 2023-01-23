// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';
import './ITieredBounty.sol';

interface ITieredFixedBounty is IBountyCore, ITieredBounty {
    function setPayoutScheduleFixed(
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external;

    function claimTieredFixed(address _payoutAddress, uint256 _tier)
        external
        returns (uint256);
}
