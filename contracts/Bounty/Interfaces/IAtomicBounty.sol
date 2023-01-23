// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

/// @title IAtomicBounty
/// @author FlacoJones
/// @notice Interface defining AtomicBounty specific methods
interface IAtomicBounty is IBountyCore {
    /// @notice Changes bounty status from 0 (OPEN) to 1 (CLOSED)
    /// @param _payoutAddress The closer of the bounty
    /// @param _closerData ABI-encoded data about the claimant and claimant asset
    function close(address _payoutAddress, bytes calldata _closerData) external;

    /// @notice Transfers full balance of _tokenAddress from bounty to _payoutAddress
    /// @param _tokenAddress ERC20 token address or Zero Address for protocol token
    /// @param _payoutAddress The destination address for the funds
    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        returns (uint256);
}
