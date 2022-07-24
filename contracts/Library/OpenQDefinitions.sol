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

    uint32 internal constant OPERATION_TYPE_INIT_ONGOING = 1;
    uint32 internal constant OPERATION_TYPE_INIT_TIERED = 2;
    uint32 internal constant OPERATION_TYPE_INIT_FUNDING_GOAL = 3;
}
