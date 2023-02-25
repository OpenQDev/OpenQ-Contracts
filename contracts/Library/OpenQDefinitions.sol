// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @title OpenQDefinitions
/// @author FlacoJones
/// @notice Constants for common operations
library OpenQDefinitions {
    /// @title OpenQDefinitions
    /// @author FlacoJones
    /// @param operationType The bounty type
    /// @param data ABI encoded data used to initialize the bounty
    struct InitOperation {
        uint32 operationType;
        bytes data;
    }

    /// @notice Bounty types
    uint32 internal constant ATOMIC = 0;
    uint32 internal constant TIERED_FIXED = 3;

    uint32 internal constant OPEN = 0;
    uint32 internal constant CLOSED = 1;
}
