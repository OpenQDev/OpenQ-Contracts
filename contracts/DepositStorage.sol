// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import './OpenQStorage.sol';

contract DepositStorage is OpenQStorage {
    struct IssueDeposit {
        address from;
        uint256 amount;
        string issueId;
    }

    struct UserDeposit {
        address from;
        uint256 amount;
        string githubUserId;
    }

    enum IssueStatus {
        OPEN,
        CLAIMED
    }

    mapping(string => uint256) public userClaimAmountByGithbUserId;

    uint256 private nextUserDepositId = 0;
    mapping(uint256 => UserDeposit) public userDeposits;
    mapping(string => uint256[]) public userDepositIdsByGithubUserId;
    mapping(address => uint256[]) public userDepositIdsBySender;

    mapping(uint256 => IssueDeposit) public issueDeposits;
    uint256 public nextIssueDepositId = 0;
    mapping(string => uint256[]) public issueDepositIdsByIssueId; // Consider removing this? Can be derived from issueDeposits. Unless we need it for deletion.
    mapping(address => uint256[]) public issueDepositIdsBySender;
    mapping(string => uint256) public issueDepositsAmountByIssueId;
    mapping(string => IssueStatus) public issueStatusByIssueId;

    // ------------ USER DEPOSITS ------------ //

    event UserDepositEvent(
        address from,
        uint256 amount,
        string githubUserId,
        uint256 depositId
    );
    event RefundUserDepositEvent(uint256 depositId);
    event WithdrawUserDepositEvent(uint256 depositId);

    function depositEthForGithubUser(
        string calldata _githubUserId,
        address msgSender
    ) external payable onlyOpenQ {
        require(msg.value > 0, 'DepositStorage: You must send ETH.');

        nextUserDepositId++;
        userDeposits[nextUserDepositId] = UserDeposit(
            msgSender,
            msg.value,
            _githubUserId
        );
        userDepositIdsByGithubUserId[_githubUserId].push(nextUserDepositId);
        userDepositIdsBySender[msgSender].push(nextUserDepositId);

        // increment claim amount
        userClaimAmountByGithbUserId[_githubUserId] += msg.value;

        emit UserDepositEvent(
            msgSender,
            msg.value,
            _githubUserId,
            nextUserDepositId
        );
    }

    function refundUserDeposit(uint256 _depositId, address msgSender)
        external
        onlyOpenQ
    {
        require(
            userDeposits[_depositId].from == msgSender,
            'DepositStorage: Deposit did not come from this Ethereum address.'
        );
        _sendDeposit(_depositId, msgSender); // msg.sender is depositor

        emit RefundUserDepositEvent(_depositId);
    }

    function withdrawUserDeposit(
        uint256 _depositId,
        address msgSender,
        string calldata _userId
    ) external onlyOpenQ {
        require(
            keccak256(bytes(userDeposits[_depositId].githubUserId)) ==
                keccak256(bytes(_userId)),
            'DepositStorage: Deposit is not for this GitHub account.'
        );
        _sendDeposit(_depositId, msgSender); // msg.sender is user

        emit WithdrawUserDepositEvent(_depositId);
    }

    function _sendDeposit(uint256 _depositId, address _to) internal {
        UserDeposit memory deposit = userDeposits[_depositId];
        payable(_to).transfer(deposit.amount);

        // reduce claim amount
        userClaimAmountByGithbUserId[deposit.githubUserId] -= deposit.amount;

        delete userDeposits[_depositId];
    }

    // ------------ ISSUE DEPOSITS ------------ //

    event IssueDepositEvent(
        address from,
        uint256 amount,
        string issueId,
        uint256 depositId
    );
    event RefundIssueDepositEvent(uint256 depositId);
    event WithdrawIssueDepositsEvent(string issueId);
    event SetGovTokenForIssueEvent(string issueId, address govTokenAddress);

    function depositEthForIssue(string calldata _issueId, address msgSender)
        external
        payable
        onlyOpenQ
    {
        require(msg.value > 0, 'DepositStorage: You must send ETH.');
        require(
            issueStatusByIssueId[_issueId] == IssueStatus.OPEN,
            'DepositStorage: Issue is not OPEN.'
        );

        nextIssueDepositId++;
        issueDeposits[nextIssueDepositId] = IssueDeposit(
            msgSender,
            msg.value,
            _issueId
        );
        issueDepositIdsByIssueId[_issueId].push(nextIssueDepositId);
        issueDepositIdsBySender[msgSender].push(nextIssueDepositId);
        issueDepositsAmountByIssueId[_issueId] += msg.value;

        emit IssueDepositEvent(
            msgSender,
            msg.value,
            _issueId,
            nextIssueDepositId
        );
    }

    //
    function refundIssueDeposit(uint256 _depositId, address msgSender)
        external
    {
        require(
            issueDeposits[_depositId].from == msgSender,
            'DepositStorage: Deposit did not come from this Ethereum address or does not exist.'
        );
        require(
            issueStatusByIssueId[issueDeposits[_depositId].issueId] ==
                IssueStatus.OPEN,
            'DepositStorage: Issue is not OPEN.'
        );

        uint256 payoutAmt = issueDeposits[_depositId].amount;
        issueDepositsAmountByIssueId[
            issueDeposits[_depositId].issueId
        ] -= payoutAmt;

        emit RefundIssueDepositEvent(_depositId);

        delete issueDeposits[_depositId];

        payable(msgSender).transfer(payoutAmt);
    }

    function withdrawIssueDeposit(
        address _payoutAddress,
        string calldata _issueId
    ) external onlyOpenQ returns (uint256) {
        require(_payoutAddress != address(0));
        require(
            issueStatusByIssueId[_issueId] != IssueStatus.CLAIMED,
            'Issue already claimed!'
        );
        uint256 payoutAmt = issueDepositsAmountByIssueId[_issueId];
        issueDepositsAmountByIssueId[_issueId] = 0;
        issueStatusByIssueId[_issueId] = IssueStatus.CLAIMED;

        emit WithdrawIssueDepositsEvent(_issueId);

        payable(_payoutAddress).transfer(payoutAmt);

        return payoutAmt;
    }
}
