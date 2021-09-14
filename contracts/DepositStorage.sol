// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import './OpenQStorage.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract DepositStorage is OpenQStorage {
    struct IssueDeposit {
        string issueId;
        mapping(string => mapping(string => uint256)) fromToTokenToAmount;
    }

    mapping(string => IssueDeposit[]) public depositsByIssueId;

    function depositERC20ForIssue(
        string calldata _issueId,
        address msgSender,
        string calldata token,
        uint256 amount
    ) external onlyOpenQ {
        require(amount > 0, 'DepositStorage: You must send some ERC20.');

        ERC20 tokenContract = ERC20(tokenAddressBySymbol[token]);
        tokenContract.transferFrom(msgSender, address(this), amount);
        depositsByIssueId[_issueId].fromToTokenToAmount[msgSender][
            token
        ] += amount;
        emit IssueDepositEvent(msgSender, token, amount, _issueId);
    }

    struct UserDeposit {
        address from;
        uint256 amount;
        string token;
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

    mapping(string => address) public tokenAddressBySymbol;

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

    function setTokenAddress(string calldata _symbol, address _tokenAddress)
        public
    {
        tokenAddressBySymbol[_symbol] = _tokenAddress;
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
        string token,
        uint256 amount,
        string issueId
    );
    event RefundIssueDepositEvent(uint256 depositId);
    event WithdrawIssueDepositsEvent(string issueId);
    event SetGovTokenForIssueEvent(string issueId, address govTokenAddress);

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

        for (uint256 i = 0; i < issueDeposits[_issueId].length; i++) {
            uint256 symbol = issueDeposits[_issueId].symbol;
            uint256 payoutAmt = issueDeposits[_issueId].amount;
            if (symbol == 'ETH') {
                payable(_payoutAddress).transfer(payoutAmt);
            }
            address tokenAddress = tokenAddressBySymbol[symbol];
            _transferERC20(tokenAddress, _payoutAddress, payoutAmt);
        }

        issueDepositsAmountByIssueId[_issueId] = 0;
        issueStatusByIssueId[_issueId] = IssueStatus.CLAIMED;

        emit WithdrawIssueDepositsEvent(_issueId);

        return payoutAmt;
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        ERC20 token = ERC20(_tokenAddress);
        return token.balanceOf(address(this));
    }

    event Approval(address indexed caller, address indexed spender);

    function _transferERC20(
        address _tokenAddress,
        address _recipient,
        uint256 _amount
    ) private {
        ERC20 token = ERC20(_tokenAddress);
        token.transfer(_recipient, _amount);
    }
}
