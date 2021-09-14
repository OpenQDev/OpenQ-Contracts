// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';

contract OpenQ {
    event IssueCreated(
        address indexed from,
        string id,
        address indexed issueAddress
    );

    mapping(string => address) public issueToAddress;

    function createIssue(string calldata _id)
        public
        returns (address issueAddress)
    {
        require(
            issueToAddress[_id] == address(0),
            'Issue already exists for given id.'
        );
        issueAddress = address(new Issue(_id));
        issueToAddress[_id] = issueAddress;

        // this event is being listened for by our oracle
        // once called, it listens for Transfer events on all registered erc20 and erc721 contracts
        emit IssueCreated(msg.sender, _id, issueAddress);
        return issueAddress;
    }
}
