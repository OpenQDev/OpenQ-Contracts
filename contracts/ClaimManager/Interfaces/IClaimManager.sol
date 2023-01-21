// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IClaimManager {
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

    event NFTClaimed(
        string bountyId,
        address bountyAddress,
        string organization,
        address closer,
        uint256 payoutTime,
        address tokenAddress,
        uint256 tokenId,
        uint256 bountyType,
        bytes data,
        uint256 version
    );
}
