// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IDepositManager {
    event TokenDepositReceived(
        bytes32 depositId,
        address bountyAddress,
        string bountyId,
        string organization,
        address tokenAddress,
        uint256 receiveTime,
        address sender,
        uint256 expiration,
        uint256 volume,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event NFTDepositReceived(
        bytes32 depositId,
        address bountyAddress,
        string bountyId,
        string organization,
        address tokenAddress,
        uint256 receiveTime,
        address sender,
        uint256 expiration,
        uint256 tokenId,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event DepositRefunded(
        bytes32 depositId,
        string bountyId,
        address bountyAddress,
        string organization,
        uint256 refundTime,
        address tokenAddress,
        uint256 volume,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event DepositExtended(
        bytes32 depositId,
        uint256 newExpiration,
        uint256 bountyType,
        bytes data,
        uint256 version
    );
}
