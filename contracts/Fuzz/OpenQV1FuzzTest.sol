// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './FunctionWrappers.sol';

contract OpenQV1FuzzTest is FunctionWrappers {
    constructor() {
        openQ.renounceOwnership();
    }

    /// @notice Checks that no codepath exists that can change oracle BESIDES transferOracle()
    /// @dev Renounce ownership, and oracle should never be able to be transferred again
    function assert_cannot_transfer_oracle() public view {
        assert(openQ.oracle() == address(oracle));
    }

    /// @notice Checks that no codepath exists that can change oracle BESIDES owner calling setBountyFactory()
    /// @dev Renounce ownership, and oracle should never be able to be transferred again
    function assert_cannot_set_bounty_factory() public view {
        assert(address(openQ.bountyFactory()) == address(bountyFactory));
    }

    /// @notice Checks that no codepath exists that can change oracle BESIDES owner calling setClaimManager()
    /// @dev Renounce ownership, and oracle should never be able to be transferred again
    function assert_cannot_set_claim_manager() public view {
        assert(openQ.claimManager() == address(claimManager));
    }

    /// @notice Checks that no codepath exists that can change oracle BESIDES owner calling setDepositManager()
    /// @dev Renounce ownership, and oracle should never be able to be transferred again
    function assert_cannot_set_deposit_manager() public view {
        assert(openQ.depositManager() == address(depositManager));
    }

    /// @notice Checks that no codepath exists that can call initialize after initialization
    /// @dev Initialize is called in constructor of Setup.sol
    function assert_cannot_call_initialize() public {
        (bool success, ) = payable(address(openQ)).call(
            abi.encodeWithSignature('initialize()')
        );
        assert(!success);
    }
}
