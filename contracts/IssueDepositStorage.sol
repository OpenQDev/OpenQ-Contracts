// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayStorage.sol';
import './OctobayGovToken.sol';

contract IssueDepositStorage is OctobayStorage {

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
        // NOT_VALID, // There's no sense of 'opening' an issue atm, this would be used if so
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
    mapping(string => OctobayGovToken) public govTokenByIssueId;

    // ------------ GSN ------------ //

    function deductGasFee(string calldata _githubUserId, uint256 _amount)
        external onlyOctobay
    {
        require(userClaimAmountByGithbUserId[_githubUserId] >= _amount, 'Not enough funds to pay gasFee');
        userClaimAmountByGithbUserId[_githubUserId] -= _amount;
    }

    // ------------ USER DEPOSITS ------------ //

    IssueDepositStorage public issueDepositStorage;

    event UserDepositEvent(address from, uint256 amount, string githubUser);

    function depositEthForGithubUser(string calldata _githubUserId, address msgSender)
        external
        payable
        onlyOctobay
    {
        require(msg.value > 0, 'You must send ETH.');

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
    }

    function refundUserDeposit(uint256 _depositId, address msgSender) external onlyOctobay {
        require(
            userDeposits[_depositId].from == msgSender,
            'Deposit did not came from this Ethereum address.'
        );
        _sendDeposit(_depositId, msgSender);   // msg.sender is depositor
    }

    function withdrawUserDeposit(uint256 _depositId, address msgSender, string calldata _userId) external onlyOctobay {
        require(
            keccak256(bytes(userDeposits[_depositId].githubUserId)) ==
                keccak256(
                    bytes(_userId)
                ),
            'Deposit is not for this GitHub account.'
        );
        _sendDeposit(_depositId, msgSender);   // msg.sender is user
    }

    function _sendDeposit(uint256 _depositId, address _to) internal {
        UserDeposit memory deposit = userDeposits[_depositId];
        payable(_to).transfer(deposit.amount);

        // reduce claim amount
        userClaimAmountByGithbUserId[deposit.githubUserId] -= deposit.amount;

        delete userDeposits[_depositId];
    }

    // ------------ ISSUE DEPOSITS ------------ //

    function setGovTokenForIssue(string calldata _issueId, address _govTokenAddress) external onlyOctobay {
        require(issueStatusByIssueId[_issueId] == IssueStatus.OPEN, 'Issue is not OPEN.');
        govTokenByIssueId[_issueId] = OctobayGovToken(_govTokenAddress);
    }

    function depositEthForIssue(string calldata _issueId, address msgSender) external payable onlyOctobay returns (uint256) {
        require(msg.value > 0, 'You must send ETH.');
        require(issueStatusByIssueId[_issueId] == IssueStatus.OPEN, 'Issue is not OPEN.');

        nextIssueDepositId++;
        issueDeposits[nextIssueDepositId] = IssueDeposit(
            msgSender,
            msg.value,
            _issueId
        );
        issueDepositIdsByIssueId[_issueId].push(nextIssueDepositId);
        issueDepositIdsBySender[msgSender].push(nextIssueDepositId);
        issueDepositsAmountByIssueId[_issueId] += msg.value;

        return nextIssueDepositId;
    }

    function refundIssueDeposit(uint256 _depositId, address msgSender) external onlyOctobay {
        require(
            issueDeposits[_depositId].from == msgSender,
            'Deposit did not come from this Ethereum address or does not exist.'
        );
        require(issueDepositStorage.issueStatusByIssueId(issueDeposits[_depositId].issueId) == IssueStatus.OPEN, 'Issue is not OPEN.');

        uint256 payoutAmt = issueDeposits[_depositId].amount;
        issueDepositsAmountByIssueId[
            issueDeposits[_depositId].issueId
        ] -= payoutAmt;
        delete issueDeposits[_depositId];
        payable(msgSender).transfer(payoutAmt);
    }

    // ------------ ISSUE CLAIMING ------------ //

    function confirmWithdrawIssueDeposit(address _payoutAddress, string calldata _issueId)
        external onlyOctobay
        returns(uint256)
    {
        require(_payoutAddress != address(0));
        uint256 payoutAmt = issueDepositsAmountByIssueId[_issueId];
        issueDepositsAmountByIssueId[_issueId] = 0;
        issueStatusByIssueId[_issueId] = IssueStatus.CLAIMED;
        // delete issueDeposits[_depositId]; ??? loop through issueDepositIdsByIssueId ???
        payable(_payoutAddress).transfer(payoutAmt);

        return payoutAmt;
    }

}