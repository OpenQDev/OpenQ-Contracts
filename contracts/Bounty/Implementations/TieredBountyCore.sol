// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/TieredBountyStorageCore.sol';

/// @title TieredBountyCore
/// @author FlacoJones
/// @notice Shared methods common to all tiered bounty types (tier meaning multiple payout levels, e.g. 1st, 2nd, 3rd)
/// @dev TieredBountyCore -> TieredBountyStorageCore -> BountyCore -> BountyStorageCore -> Core Dependencies (OZ + Custom)
abstract contract TieredBountyCore is TieredBountyStorageCore {
    /// @notice Sets tierClaimed to true for the given tier
    /// @param _tier The tier being claimed
    function setTierClaimed(uint256 _tier) external onlyClaimManager {
        tierClaimed[_tier] = true;
    }

    /// @notice Sets a winner for a particular tier
    /// @param _tier The tier they won
    /// @param _winner The external UUID (e.g. an OpenQ User UUID) that won this tier
    function setTierWinner(string memory _winner, uint256 _tier)
        external
        onlyOpenQ
    {
        tierWinners[_tier] = _winner;
    }

    /// @notice Returns array of winners
    /// @return An array of the external ids (e.g. OpenQ User UUIDs) of the tier winners
    function getTierWinners() external view returns (string[] memory) {
        return tierWinners;
    }

    /// @notice Whether or not invoice has been completed
    /// @param _data ABI encoded data ((uint256), [tier])
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        (uint256 _tier, bool _invoiceComplete) = abi.decode(
            _data,
            (uint256, bool)
        );
        invoiceComplete[_tier] = _invoiceComplete;
    }

    /// @notice Whether or not supporting documents have been completed
    /// @param _data ABI encoded data ((uint256), [tier])
    function setSupportingDocumentsComplete(bytes calldata _data)
        external
        onlyOpenQ
    {
        (uint256 _tier, bool _supportingDocumentsComplete) = abi.decode(
            _data,
            (uint256, bool)
        );
        supportingDocumentsComplete[_tier] = _supportingDocumentsComplete;
    }

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
    ) external override onlyDepositManager nonReentrant returns (bytes32) {
        require(
            nftDeposits.length < nftDepositLimit,
            Errors.NFT_DEPOSIT_LIMIT_REACHED
        );
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId();

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        uint256 _tier = abi.decode(_data, (uint256));
        tier[depositId] = _tier;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    /// @notice Returns an array for the payoutSchedule
    /// @return payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
    function getPayoutSchedule() external view returns (uint256[] memory) {
        return payoutSchedule;
    }
}
