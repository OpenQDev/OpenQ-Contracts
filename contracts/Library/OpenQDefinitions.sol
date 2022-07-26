// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

library OpenQDefinitions {
    /**
     * @dev Batch operation data
     */
    struct Operation {
        // Operation type
        uint32 operationType;
        // Data specific to the operation
        bytes data;
    }

    // BOUNTY CLASSES
    uint32 internal constant SINGLE = 0;
    uint32 internal constant ONGOING = 1;
    uint32 internal constant TIERED = 2;
    uint32 internal constant FUNDING_GOAL = 3;

    // STATUS
    uint32 internal constant OPEN = 0;
    uint32 internal constant BOUNTY_CLOSED = 1;
    uint32 internal constant COMPETITION_CLOSED = 2;
    uint32 internal constant ONGOING_CLOSED = 3;
}
