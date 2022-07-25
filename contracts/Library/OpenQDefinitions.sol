// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

library OpenQDefinitions {
    /**
     * @dev Batch operation data
     */
    struct Operation {
        // Operation type. Defined in BatchOperation (Definitions.sol)
        uint32 operationType;
        // Data specific to the operation
        bytes data;
    }

    uint32 internal constant SINGLE = 0;
    uint32 internal constant ONGOING = 1;
    uint32 internal constant TIERED = 2;
    uint32 internal constant FUNDING_GOAL = 3;
    uint32 internal constant DEPOSIT = 4;
}
