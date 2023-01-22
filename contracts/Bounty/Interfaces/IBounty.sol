// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../../Library/OpenQDefinitions.sol';

interface IBounty {
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

    function close(address _payoutAddress, bytes calldata _closerData) external;

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
    function issuer() external returns (address);

    function bountyType() external returns (uint256);
}
