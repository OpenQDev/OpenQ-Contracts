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

    /// @notice Whether or not invoice has been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setInvoiceComplete.(_data) for _data ABI encoding schema
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        (uint256 _tier, bool _invoiceComplete) = abi.decode(
            _data,
            (uint256, bool)
        );
        invoiceComplete[_tier] = _invoiceComplete;
    }

    /// @notice Whether or not supporting documents have been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setSupportingDocumentsComplete.(_data) for _data ABI encoding schema
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

    /// @notice Returns an array for the payoutSchedule
    /// @return payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
    function getPayoutSchedule() external view returns (uint256[] memory) {
        return payoutSchedule;
    }

    /// @notice Returns array of winners
    /// @return An array of the external ids (e.g. OpenQ User UUIDs) of the tier winners
    function getTierWinners() external view returns (string[] memory) {
        return tierWinners;
    }

    /// @notice Returns array of invoice complete
    /// @return An array of the booleans for each tier, true or false for if invoices have been completed for that tier
    /// @dev We return from all IBountyCore.getSupportingDocumentsComplete() as bytes to accomodate different return types
    /// @dev _data (bool[])
    /// @dev _data (invoiceComplete)
    function getInvoiceComplete() external view returns (bytes memory) {
        return abi.encode(invoiceComplete);
    }

    /// @notice Returns array of supporting documents complete
    /// @return An array of the booleans for each tier, true or false for if supporting documents have been completed for that tier
    /// @dev We return from all IBountyCore.getSupportingDocumentsComplete() as bytes to accomodate different return types
    /// @dev _data (bool[])
    /// @dev _data (supportingDocumentsComplete)
    function getSupportingDocumentsComplete()
        external
        view
        returns (bytes memory)
    {
        return abi.encode(supportingDocumentsComplete);
    }
}
