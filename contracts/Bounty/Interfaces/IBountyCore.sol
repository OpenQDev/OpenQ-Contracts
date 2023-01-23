// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../../Library/OpenQDefinitions.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';

/// @title IBountyCore
/// @author FlacoJones
/// @notice Interface defining BountyCore methods shared across all bounty types
interface IBountyCore {
    /// @notice Initializes a bounty proxy with initial state
    /// @param _bountyId The unique bounty identifier
    /// @param _issuer The sender of the mint bounty transaction
    /// @param _organization The organization associated with the bounty
    /// @param _openQ The OpenQProxy address
    /// @param _claimManager The Claim Manager proxy address
    /// @param _depositManager The Deposit Manager proxy address
    /// @param _operation The ABI encoded data determining the type of bounty being initialized and associated data
    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ,
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory _operation
    ) external;

    /// @notice Creates a deposit and transfers tokens from msg.sender to this contract
    /// @param _funder The funder's address
    /// @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
    /// @param _volume The volume of token to transfer
    /// @param _expiration The duration until the deposit becomes refundable
    /// @return (depositId, volumeReceived) Returns the deposit id and the amount transferred to bounty
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable returns (bytes32, uint256);

    /// @notice Receives an NFT for this contract
    /// @param _sender Sender of the NFT
    /// @param _tokenAddress NFT token address
    /// @param _tokenId NFT token id
    /// @param _expiration How long before this deposit becomes refundable
    /// @param _data ABI encoded data (unused in this case)
    /// @return bytes32 the deposit id
    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata _data
    ) external returns (bytes32);

    /// @notice Transfers volume of deposit or NFT of deposit from bounty to funder
    /// @param _depositId The deposit to refund
    /// @param _funder The initial funder of the deposit
    /// @param _volume The volume to be refunded (only relevant if deposit is not an NFT, otherwise is zero)
    function refundDeposit(
        bytes32 _depositId,
        address _funder,
        uint256 _volume
    ) external;

    /// @notice Extends deposit duration
    /// @param _depositId The deposit to extend
    /// @param _seconds Number of seconds to extend deposit
    /// @param _funder The initial funder of the deposit
    function extendDeposit(
        bytes32 _depositId,
        uint256 _seconds,
        address _funder
    ) external returns (uint256);

    /// @notice Transfers NFT from bounty address to _payoutAddress
    /// @param _payoutAddress The destination address for the NFT
    /// @param _depositId The payout address of the bounty
    function claimNft(address _payoutAddress, bytes32 _depositId) external;

    /// @notice Sets the funding goal
    /// @param _fundingToken Token address for funding goal
    /// @param _fundingGoal Token volume for funding goal
    function setFundingGoal(address _fundingToken, uint256 _fundingGoal)
        external;

    /// @notice Whether or not KYC is required to fund and claim the bounty
    /// @param _kycRequired Whether or not KYC is required to fund and claim the bounty
    function setKycRequired(bool _kycRequired) external;

    /// @notice Whether or not the Bounty is invoiceRequired
    /// @param _invoiceRequired Whether or not the Bounty is invoiceRequired
    function setInvoiceRequired(bool _invoiceRequired) external;

    /// @notice Whether or not KYC is required to fund and claim the bounty
    /// @param _supportingDocumentsRequired Whether or not KYC is required to fund and claim the bounty
    function setSupportingDocumentsRequired(bool _supportingDocumentsRequired)
        external;

    /// @notice Whether or not invoice has been completed
    /// @param _data ABI encoded data ((uint256), [tier])
    function setInvoiceComplete(bytes calldata _data) external;

    /// @notice Whether or not supporting documents have been completed
    /// @param _data ABI encoded data
    function setSupportingDocumentsComplete(bytes calldata _data) external;

    /// @notice Returns token balance for both ERC20 or protocol token
    /// @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
    function getTokenBalance(address _tokenAddress)
        external
        view
        returns (uint256);

    /// @notice Returns an array of all ERC20 token addresses which have funded this bounty
    /// @return tokenAddresses An array of all ERC20 token addresses which have funded this bounty
    function getTokenAddresses() external view returns (address[] memory);

    /// @notice Returns an array of ONLY NFT deposits for this bounty
    /// @return nftDeposits The array of NFT deposits
    function getNftDeposits() external view returns (bytes32[] memory);

    /// @notice Returns the amount of locked tokens (of a specific token) on a bounty address, only available for claims but not for refunds
    /// @param _depositId The depositId that determines which token is being looked at
    /// @return uint256
    function getLockedFunds(address _depositId) external view returns (uint256);

    /// @notice Returns the total number of unique tokens deposited on the bounty
    /// @return tokenAddressesCount The length of the array of all ERC20 token addresses which have funded this bounty
    function getTokenAddressesCount() external view returns (uint256);

    // PUBLIC GETTERS
    function bountyId() external view returns (string memory);

    function bountyCreatedTime() external view returns (uint256);

    function bountyClosedTime() external view returns (uint256);

    function issuer() external view returns (address);

    function organization() external view returns (string memory);

    function closer() external view returns (address);

    function status() external view returns (uint256);

    function nftDepositLimit() external view returns (uint256);

    function funder(bytes32) external view returns (address);

    function tokenAddress(bytes32) external view returns (address);

    function volume(bytes32) external view returns (uint256);

    function depositTime(bytes32) external view returns (uint256);

    function refunded(bytes32) external view returns (bool);

    function payoutAddress(bytes32) external view returns (address);

    function tokenId(bytes32) external view returns (uint256);

    function expiration(bytes32) external view returns (uint256);

    function isNFT(bytes32) external view returns (bool);

    function deposits(uint256) external view returns (bytes32);

    function nftDeposits(uint256) external view returns (bytes32);

    function closerData() external view returns (bytes memory);

    function bountyType() external view returns (uint256);

    function hasFundingGoal() external view returns (bool);

    function fundingToken() external view returns (address);

    function fundingGoal() external view returns (uint256);

    function invoiceRequired() external view returns (bool);

    function kycRequired() external view returns (bool);

    function supportingDocumentsRequired() external view returns (bool);

    function issuerExternalUserId() external view returns (string memory);
}
