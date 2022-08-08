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
        address bountyAddress,
        uint256 bountyMintTime,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event BountyClosed(
        string bountyId,
        address bountyAddress,
        string organization,
        address closer,
        uint256 bountyClosedTime,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    /**
     * @dev Data Spec:
     * (address bountyAddress, string externalUserId, address closerAddress, string claimantAsset)
     *
     * abi.decode((address,string,address,string), data);
     */
    event ClaimSuccess(
        uint256 claimTime,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

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

    event TokenBalanceClaimed(
        string bountyId,
        address bountyAddress,
        string organization,
        address closer,
        uint256 payoutTime,
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
