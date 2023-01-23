// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @title IKycValidity
/// @author FlacoJones
/// @notice An interface for checking whether an address has a valid kycNFT token
/// @dev This interface integrates with KYC DAO (https://docs.kycdao.xyz/smartcontracts/evm/#adding-on-chain-kycnft-checks)
interface IKycValidity {
    /// @dev Check whether a given address has a valid kycNFT token
    /// @param _addr Address to check for kycNFT token
    /// @return valid Whether the address has a valid kycNFT token
    function hasValidToken(address _addr) external view returns (bool valid);
}
