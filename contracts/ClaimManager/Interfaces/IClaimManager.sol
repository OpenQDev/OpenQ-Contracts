// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @title IClaimManager
/// @author FlacoJones
/// @notice Interface for ClaimManager defining all events
interface IClaimManager {
    /// @notice Emitted when any bounty type is closed
    /// @param bountyId Unique bounty id
    /// @param bountyAddress Address of the bounty associated with the event
    /// @param organization Address of the bounty associated with the event
    /// @param closer Address of the recipient of the funds
    /// @param bountyClosedTime Block timestamp of the close
    /// @param bountyType The type of bounty closed. See OpenQDefinitions.sol
    /// @param data ABI encoded data associated with the BountyClosed event. Specific to each bounty type.
    /// @param version Which version of ClaimManager emitted the event. Increments with each ClaimManager release to instruct data decoding
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

    /// @notice Emitted when a claim occurs on any bounty type
    /// @param claimTime The block timestamp in which the claim occurred
    /// @param bountyType The type of bounty closed. See OpenQDefinitions.sol
    /// @param data ABI encoded data associated with the ClaimSuccess event. Specific to each bounty type.
    /// @param version Which version of ClaimManager emitted the event. Increments with each ClaimManager release to instruct data decoding
    event ClaimSuccess(
        uint256 claimTime,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    /// @notice Emitted any time a volume of tokens is claimed
    /// @param bountyId Unique bounty id
    /// @param bountyAddress Address of the bounty associated with the event
    /// @param organization Address of the bounty associated with the event
    /// @param closer Address of the recipient of the funds
    /// @param payoutTime Block timestamp of the claim
    /// @param tokenAddress Address of the token
    /// @param volume Volume of the token claim
    /// @param bountyType The type of bounty closed. See OpenQDefinitions.sol
    /// @param data ABI encoded data associated with the TokenBalanceClaimed event. Specific to each bounty type.
    /// @param version Which version of ClaimManager emitted the event. Increments with each ClaimManager release to instruct data decoding
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

    /// @notice
    /// @param bountyId Unique bounty id
    /// @param bountyAddress Address of the bounty associated with the event
    /// @param organization Address of the bounty associated with the event
    /// @param closer Address of the recipient of the funds
    /// @param payoutTime Block timestamp of the claim
    /// @param tokenAddress Address of the token
    /// @param tokenId Token ID of the NFT claimed
    /// @param bountyType The type of bounty closed. See OpenQDefinitions.sol
    /// @param data ABI encoded data associated with the NFTClaimed event. Specific to each bounty type.
    /// @param version Which version of ClaimManager emitted the event. Increments with each ClaimManager release to instruct data decoding
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
