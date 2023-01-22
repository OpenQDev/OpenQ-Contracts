// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../../Library/OpenQDefinitions.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';

interface IBountyCore {
    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ,
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory _operation
    ) external;

    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable returns (bytes32, uint256);

    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata _data
    ) external returns (bytes32);

    function refundDeposit(
        bytes32 _depositId,
        address _funder,
        uint256 _volume
    ) external;

    function extendDeposit(
        bytes32 _depositId,
        uint256 _seconds,
        address _funder
    ) external returns (uint256);

    function getTokenBalance(address _tokenAddress)
        external
        view
        returns (uint256);

    function setFundingGoal(address _fundingToken, uint256 _fundingGoal)
        external;

    function setKycRequired(bool _kycRequired) external;

    function setInvoiceable(bool _invoiceable) external;

    function setSupportingDocuments(bool _supportingDocuments) external;

    function setInvoiceComplete(bytes calldata _data) external;

    function setSupportingDocumentsComplete(bytes calldata _data) external;

    // State getters
    function bountyId() external returns (string memory);

    function bountyCreatedTime() external returns (uint256);

    function bountyClosedTime() external returns (uint256);

    function issuer() external returns (address);

    function organization() external returns (string memory);

    function closer() external returns (address);

    function status() external returns (uint256);

    function nftDepositLimit() external returns (uint256);

    function funder(bytes32) external returns (address);

    function tokenAddress(bytes32) external returns (address);

    function volume(bytes32) external returns (uint256);

    function depositTime(bytes32) external returns (uint256);

    function refunded(bytes32) external returns (bool);

    function payoutAddress(bytes32) external returns (address);

    function tokenId(bytes32) external returns (uint256);

    function expiration(bytes32) external returns (uint256);

    function isNFT(bytes32) external returns (bool);

    function deposits(uint256) external returns (bytes32);

    function nftDeposits(uint256) external returns (bytes32);

    function closerData() external returns (bytes memory);

    function bountyType() external returns (uint256);

    function hasFundingGoal() external returns (bool);

    function fundingToken() external returns (address);

    function fundingGoal() external returns (uint256);

    function invoiceable() external returns (bool);

    function kycRequired() external returns (bool);

    function supportingDocuments() external returns (bool);

    function externalUserId() external returns (string memory);
}
