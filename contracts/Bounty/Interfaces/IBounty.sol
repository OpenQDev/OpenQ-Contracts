// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IAtomicBounty.sol';
import './IOngoingBounty.sol';
import './ITieredPercentageBounty.sol';
import './ITieredFixedBounty.sol';

/// @title IBounty
/// @author FlacoJones
/// @notice Interface aggregating all bounty type interfaces for use in OpenQ, ClaimManager and DepositManager
interface IBounty is
    IAtomicBounty,
    IOngoingBounty,
    ITieredPercentageBounty,
    ITieredFixedBounty
{

}
