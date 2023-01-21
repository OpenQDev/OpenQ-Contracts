// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/**
 * @title IOpenQ
 * @dev Interface declaring all OpenQ Events
 */
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
        bytes data,
        uint256 version
    );

    event InvoiceableSet(
        address bountyAddress,
        bool invoiceable,
        bytes data,
        uint256 version
    );

    event SupportingDocumentsSet(
        address bountyAddress,
        bool supportingDocuments,
        bytes data,
        uint256 version
    );

    event InvoiceCompletedSet(
        address bountyAddress,
        bool[] invoiceCompletedSet,
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

    event SupportingDocumentsCompletedSet(
        address bountyAddress,
        bool[] supportDocumentsCompleted,
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
        string externalUserId,
        address newAddress,
        bytes data,
        uint256 version
    );
}
