// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract OpenQ is Ownable {
    string[] public issueIds;
    mapping(string => address) public issueToAddress;
    mapping(address => string) public addressToIssue;
    address[] public tokenAddresses;

    event IssueCreated(
        address indexed from,
        string id,
        address indexed issueAddress
    );

    event IssueClosed(
        string id,
        address indexed issueAddress,
        address indexed payoutAddress
    );

    function getIssueIds() public view returns (string[] memory) {
        return issueIds;
    }

    function issueIsOpen(string calldata id_) public view returns (bool) {
        Issue issue = Issue(this.issueToAddress(id_));
        bool isOpen = issue.status() == Issue.IssueStatus.OPEN;
        return isOpen;
    }

    function mintBounty(string calldata _id)
        public
        returns (address issueAddress)
    {
        require(
            issueToAddress[_id] == address(0),
            'Issue already exists for given id. Find its address by calling issueToAddress on this contract with the issueId'
        );
        issueAddress = address(new Issue(_id, tokenAddresses));
        issueToAddress[_id] = issueAddress;
        addressToIssue[issueAddress] = _id;
        issueIds.push(_id);

        emit IssueCreated(msg.sender, _id, issueAddress);
        return issueAddress;
    }

    function getBountyAddress(string calldata _id)
        public
        view
        returns (address)
    {
        return issueToAddress[_id];
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOwner
    {
        address issueAddress = issueToAddress[_id];
        Issue issue = Issue(issueAddress);
        issue.transferAllERC20(_payoutAddress);
        emit IssueClosed(_id, issueAddress, _payoutAddress);
    }

    function addTokenAddress(address tokenAddress) public {
        tokenAddresses.push(tokenAddress);
    }
}
