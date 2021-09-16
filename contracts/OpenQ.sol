// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';

contract OpenQ {
    constructor() {
        owner = msg.sender;
    }

    address owner;
    mapping(string => address) public issueToAddress;
    address[] public tokenAddresses;

    event IssueCreated(
        address indexed from,
        string id,
        address indexed issueAddress
    );

    function createIssue(string calldata _id)
        public
        returns (address issueAddress)
    {
        require(
            issueToAddress[_id] == address(0),
            'Issue already exists for given id. Find its address by calling issueToAddress on this contract with the issueId'
        );
        issueAddress = address(new Issue(_id, tokenAddresses));
        issueToAddress[_id] = issueAddress;

        emit IssueCreated(msg.sender, _id, issueAddress);
        return issueAddress;
    }

    function withdrawIssueDeposit(string calldata _id, address _payoutAddress)
        public
    {
        require(msg.sender == owner, 'Only callable by OpenQ owner');
        Issue issue = Issue(issueToAddress[_id]);
        issue.transferAllERC20(_payoutAddress);
    }

    function addTokenAddress(address tokenAddress) public {
        tokenAddresses.push(tokenAddress);
    }
}
