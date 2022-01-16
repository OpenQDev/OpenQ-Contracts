// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Bountyable {
    function receiveFunds(
        address,
        address,
        uint256
    ) external returns (uint256);

    function claim(address, address) external returns (bool);

    function closeBounty(address) external returns (bool);

    function refundBountyDeposit(address, address) external returns (bool);

    function getERC20Balance(address) external view returns (uint256);

    function getFunderTokenAddresses(address)
        external
        view
        returns (address[] memory);

    function getBountyTokenAddresses() external view returns (address[] memory);
}
