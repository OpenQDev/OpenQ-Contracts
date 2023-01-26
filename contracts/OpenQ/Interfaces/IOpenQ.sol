// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @title IOpenQ
/// @author FlacoJones
/// @notice Interface declaring OpenQ events and methods used by other contracts
interface IOpenQ {
    function externalUserIdToAddress(string calldata)
        external
        returns (address);

    function addressToExternalUserId(address) external returns (string memory);

    event TierClaimed(
        address bountyAddress,
        address claimant,
        bytes data,
        uint256 version
    );

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

    event FundingGoalSet(
        address bountyAddress,
        address fundingGoalTokenAddress,
        uint256 fundingGoalVolume,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event PayoutSet(
        address bountyAddress,
        address payoutTokenAddress,
        uint256 payoutTokenVolume,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event PayoutScheduleSet(
        address bountyAddress,
        address payoutTokenAddress,
        uint256[] payoutSchedule,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event KYCRequiredSet(
        address bountyAddress,
        bool kycRequired,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event InvoiceRequiredSet(
        address bountyAddress,
        bool invoiceRequired,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event SupportingDocumentsRequiredSet(
        address bountyAddress,
        bool supportingDocuments,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event InvoiceCompletedSet(
        address bountyAddress,
        uint256 bountyType,
        bytes data,
        uint256 version
    );

    event SupportingDocumentsCompletedSet(
        address bountyAddress,
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

    event TierWinnerSelected(
        address bountyAddress,
        string[] tierWinners,
        bytes data,
        uint256 version
    );

    event ExternalUserIdAssociatedWithAddress(
        string currentExternalUserId,
        address newAddress,
        string oldExternalUserId,
        address oldAddress,
        bytes data,
        uint256 version
    );
}
