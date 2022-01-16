// contracts/OpenQ.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../Bounty/Bounty.sol';
import '../Bounty/Bountyable.sol';

interface IOpenQ {
    // Events
    event BountyCreated(
        string bountyId,
        string organization,
        address issuerAddress,
        address bountyAddress,
        uint256 bountyMintTime
    );

    event BountyClosed(
        string bountyId,
        string organization,
        address bountyAddress,
        address payoutAddress,
        uint256 bountyClosedTime
    );

    event DepositReceived(
        string bountyId,
        string organization,
        address bountyAddress,
        address tokenAddress,
        address sender,
        uint256 volume,
        uint256 receiveTime
    );

    event DepositRefunded(
        string bountyId,
        string organization,
        address bountyAddress,
        address tokenAddress,
        address sender,
        uint256 volume,
        uint256 refundTime
    );

    event BountyPaidout(
        string bountyId,
        string organization,
        address bountyAddress,
        address tokenAddress,
        address payoutAddress,
        uint256 volume,
        uint256 payoutTime
    );

    function mintBounty(string calldata, string calldata)
        external
        returns (address);

    function fundBounty(
        address,
        address,
        uint256
    ) external returns (bool);

    function claimBounty(string calldata, address) external;

    function refundBountyDeposits(address) external returns (bool);

    function bountyIsOpen(string memory) external view returns (bool);
}
