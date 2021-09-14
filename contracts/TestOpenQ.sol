// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';

contract TestOpenQ {
    event IssueCreated(string indexed id, address indexed issueAddress);

    function createIssue(string calldata id)
        public
        returns (address issueAddress)
    {
        issueAddress = address(new Issue(id));
        emit IssueCreated(id, issueAddress);
        return issueAddress;
    }
}
