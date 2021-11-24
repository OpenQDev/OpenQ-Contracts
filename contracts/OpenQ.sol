// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';

contract OpenQ is Ownable {
    // Properties
    mapping(string => address) public issueToAddress;
    mapping(address => string) public addressToIssue;

    // Events
    event IssueCreated(
        string issueId,
        address indexed issuer,
        address indexed issueAddress,
        uint256 issueMintTime
    );

    event IssueClosed(
        string issueId,
        address indexed issueAddress,
        address indexed payoutAddress,
        uint256 issueClosedTime
    );

    event FundsReceived(
        string issueId,
        address issueAddress,
        address tokenAddress,
        address sender,
        uint256 value,
        uint256 receiveTime
    );

    event DepositsRefunded(
        string issueId,
        address issueAddress,
        address tokenAddress,
        address funder,
        uint256 value,
        uint256 refundTime
    );

    // Transactions
    function mintBounty(string calldata _id)
        public
        returns (address issueAddress)
    {
        require(
            issueToAddress[_id] == address(0),
            'Issue already exists for given id. Find its address by calling issueToAddress on this contract with the issueId'
        );
        issueAddress = address(new Issue(_id, msg.sender));
        issueToAddress[_id] = issueAddress;
        addressToIssue[issueAddress] = _id;

        emit IssueCreated(_id, msg.sender, issueAddress, block.timestamp);

        return issueAddress;
    }

    function fundBounty(
        address _issueAddress,
        address _tokenAddress,
        uint256 _value
    ) public returns (bool success) {
        Issue issue = Issue(_issueAddress);
        issue.receiveFunds(msg.sender, _tokenAddress, _value);
        emit FundsReceived(
            issue.issueId(),
            _issueAddress,
            _tokenAddress,
            msg.sender,
            _value,
            block.timestamp
        );

        return true;
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOwner
    {
        address issueAddress = issueToAddress[_id];
        Issue issue = Issue(issueAddress);
        issue.transferAllERC20(_payoutAddress);
        emit IssueClosed(_id, issueAddress, _payoutAddress, block.timestamp);
    }

    function refundBountyDeposits(address _issueAddress)
        public
        returns (bool success)
    {
        Issue issue = Issue(_issueAddress);

        require(
            block.timestamp >= issue.issueCreatedTime() + issue.escrowPeriod(),
            'Too early to withdraw funds'
        );

        require(
            issue.isAFunder(msg.sender) == true,
            'Only funders of this bounty can reclaim funds after 30 days.'
        );

        for (
            uint256 i = 0;
            i < issue.getFundersTokenAddresses(msg.sender).length;
            i++
        ) {
            address tokenAddress = issue.fundersTokenAddresses(msg.sender, i);
            uint256 value = issue.funders(msg.sender, tokenAddress);

            issue.refundBountyDeposit(msg.sender, tokenAddress);

            emit DepositsRefunded(
                issue.issueId(),
                _issueAddress,
                tokenAddress,
                msg.sender,
                value,
                block.timestamp
            );
        }

        return true;
    }

    // Convenience Methods
    function issueIsOpen(string calldata id_) public view returns (bool) {
        Issue issue = Issue(this.issueToAddress(id_));
        bool isOpen = issue.status() == Issue.IssueStatus.OPEN;
        return isOpen;
    }

    function getBountyAddress(string calldata _id)
        public
        view
        returns (address)
    {
        return issueToAddress[_id];
    }
}
