// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IAtomicBounty.sol';
import './IOngoingBounty.sol';
import './ITieredPercentageBounty.sol';
import './ITieredFixedBounty.sol';

interface IBounty is
    IAtomicBounty,
    IOngoingBounty,
    ITieredPercentageBounty,
    ITieredFixedBounty
{}
