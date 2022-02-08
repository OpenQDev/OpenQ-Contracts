// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

interface Bountyable {
    function receiveFunds(
        address,
        address,
        uint256,
        bool,
        uint256
    )
        external
        payable
        returns (
            bytes32,
            string memory,
            uint256
        );

    function claim(address, bytes32) external returns (bool);

    function closeBounty(address) external returns (bool);

    function refundBountyDeposit(address, bytes32) external returns (bool);

    function getERC20Balance(address) external view returns (uint256);

    function getBountyTokenAddresses() external view returns (address[] memory);
}
