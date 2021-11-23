// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';

contract OpenQ is Ownable {
    string[] public issueIds;
    mapping(string => address) public issueToAddress;
    mapping(address => string) public addressToIssue;
    address[] public tokenAddresses;

    event IssueCreated(
        string issueId,
        address indexed issuer,
        address indexed issueAddress,
        address[] tokenAddresses,
        uint256 issueMintTime
    );

    event IssueClosed(
        string issueId,
        address indexed issueAddress,
        address indexed payoutAddress,
        uint256 issueClosedTime
    );

    event FundsReceived(
        address indexed sender,
        address tokenAddress,
        string symbol,
        uint256 value,
        uint256 receiveTime
    );

    event DepositsRefunded(
        address indexed funder,
        address tokenAddress,
        uint256 value,
        uint256 refundTime
    );

    function getIssueIds() public view returns (string[] memory) {
        return issueIds;
    }

    function issueIsOpen(string calldata id_) public view returns (bool) {
        Issue issue = Issue(this.issueToAddress(id_));
        bool isOpen = issue.status() == Issue.IssueStatus.OPEN;
        return isOpen;
    }

    function safeApprove(
        address _token,
        address _issueAddress,
        uint256 _value
    ) public returns (bool success) {
        TransferHelper.safeApprove(_token, _issueAddress, _value);
        return true;
    }

    function refundBountyDeposits(address _funder, address _issueAddress)
        public
        returns (bool success)
    {
        Issue issue = Issue(_issueAddress);

        require(
            block.timestamp >= issue.issueTime() + issue.escrowPeriod(),
            'Too early to withdraw funds'
        );

        require(
            issue.isAFunder(_funder) == true,
            'Only funders of this bounty can reclaim funds after 30 days.'
        );

        for (
            uint256 i = 0;
            i < issue.getFundersTokenAddresses(_funder).length;
            i++
        ) {
            address tokenAddress = issue.fundersTokenAddresses(_funder, i);
            uint256 value = issue.funders(_funder, tokenAddress);

            issue.refundBountyDeposit(_funder, tokenAddress);

            emit DepositsRefunded(
                _funder,
                tokenAddress,
                value,
                block.timestamp
            );
        }

        return true;
    }

    function fundBounty(
        address _issueAddress,
        address _tokenAddress,
        string calldata _symbol,
        uint256 _value
    ) public returns (bool success) {
        Issue issue = Issue(_issueAddress);
        issue.receiveFunds(msg.sender, _tokenAddress, _value);
        emit FundsReceived(
            msg.sender,
            _tokenAddress,
            _symbol,
            _value,
            block.timestamp
        );
        return true;
    }

    function mintBounty(string calldata _id)
        public
        returns (address issueAddress)
    {
        require(
            issueToAddress[_id] == address(0),
            'Issue already exists for given id. Find its address by calling issueToAddress on this contract with the issueId'
        );
        issueAddress = address(new Issue(_id, msg.sender, tokenAddresses));
        issueToAddress[_id] = issueAddress;
        addressToIssue[issueAddress] = _id;
        issueIds.push(_id);

        emit IssueCreated(
            _id,
            msg.sender,
            issueAddress,
            tokenAddresses,
            block.timestamp
        );

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
        emit IssueClosed(_id, issueAddress, _payoutAddress, block.timestamp);
    }

    function addTokenAddress(address tokenAddress) public {
        tokenAddresses.push(tokenAddress);
    }
}
