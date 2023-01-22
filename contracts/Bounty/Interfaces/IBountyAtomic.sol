// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyAtomic is IBountyCore {
    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        returns (uint256);

    function close(address _payoutAddress, bytes calldata _closerData) external;

    function getTokenAddresses() external view returns (address[] memory);

    function getNftDeposits() external view returns (bytes32[] memory);

    function getLockedFunds(address) external view returns (uint256);

    function getTokenAddressesCount() external view returns (uint256);
}
