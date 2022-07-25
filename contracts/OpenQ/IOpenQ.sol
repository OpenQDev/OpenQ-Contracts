// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

/**
 * @title IOpenQ
 * @dev Interface declaring all OpenQ Events
 */
interface IOpenQ {
    event BountyCreated(
        string bountyId,
        string organization,
        address issuerAddress,
        address indexed bountyAddress,
        uint256 bountyMintTime,
        uint256 class,
        bytes data
    );

    event BountyClosed(
        string bountyId,
        address indexed bountyAddress,
        string organization,
        address closer,
        uint256 bountyClosedTime,
        uint256 class,
        bytes data
    );

    event TokenDepositReceived(
        bytes32 depositId,
        address indexed bountyAddress,
        string bountyId,
        string organization,
        address tokenAddress,
        uint256 receiveTime,
        address sender,
        uint256 expiration,
        uint256 volume,
        uint256 class,
        bytes data
    );

    event NFTDepositReceived(
        bytes32 depositId,
        address indexed bountyAddress,
        string bountyId,
        string organization,
        address tokenAddress,
        uint256 receiveTime,
        address sender,
        uint256 expiration,
        uint256 tokenId,
        uint256 class,
        bytes data
    );

    event DepositRefunded(
        bytes32 depositId,
        string bountyId,
        address indexed bountyAddress,
        string organization,
        uint256 refundTime,
        address tokenAddress,
        uint256 volume,
        uint256 class,
        bytes data
    );

    event TokenBalanceClaimed(
        string bountyId,
        address indexed bountyAddress,
        string organization,
        address closer,
        uint256 payoutTime,
        address tokenAddress,
        uint256 volume,
        uint256 class,
        bytes data
    );

    event DepositExtended(
        bytes32 depositId,
        uint256 newExpiration,
        uint256 class,
        bytes data
    );

    /**
     * @dev Batch operation data
     */
    struct Operation {
        // Operation type. Defined in BatchOperation (Definitions.sol)
        uint32 operationType;
        // Operation target
        address target;
        // Data specific to the operation
        bytes data;
    }
}
