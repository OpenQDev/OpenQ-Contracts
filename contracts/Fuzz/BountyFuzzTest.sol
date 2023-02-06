// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './FunctionWrappers.sol';

contract BountyFuzzTest is FunctionWrappers {
    constructor() {}

    /// @notice Checks that no codepath exists that can change the issuer of a bounty
    function assert_bounty_issuer_never_changes() public {
        //************************* Pre-Conditions *************************/
        if (!bountiesDeployed) deployBounties();

        //************************* Action *************************/

        //************************* Post-Conditions *************************/
        assert(atomicBounty.issuer() == address(minter));
        assert(ongoingBounty.issuer() == address(minter));
        assert(tieredFixedBounty.issuer() == address(minter));
        assert(tieredPercentageBounty.issuer() == address(minter));
    }
}
