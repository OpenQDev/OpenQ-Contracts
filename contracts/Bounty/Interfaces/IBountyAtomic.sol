// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IBounty.sol';

interface IBountyAtomic is IBounty {
    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        returns (uint256);

    function claimNft(address _payoutAddress, bytes32 _depositId) external;
}
