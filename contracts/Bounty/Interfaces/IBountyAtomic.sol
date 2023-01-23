// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBountyCore.sol';

interface IBountyAtomic is IBountyCore {
    function close(address _payoutAddress, bytes calldata _closerData) external;

    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        returns (uint256);
}
