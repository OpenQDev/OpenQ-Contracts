// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyAtomic.sol';
import './IBountyOngoing.sol';
import './IBountyTieredPercentage.sol';
import './IBountyTieredFixed.sol';

interface IBounty is
    IBountyAtomic,
    IBountyOngoing,
    IBountyTieredPercentage,
    IBountyTieredFixed
{}
