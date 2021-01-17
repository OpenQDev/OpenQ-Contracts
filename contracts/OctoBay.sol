// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.6/ChainlinkClient.sol';
import '@opengsn/gsn/contracts/BaseRelayRecipient.sol';
import '@opengsn/gsn/contracts/BasePaymaster.sol';
import './interfaces/IUniswapV2Router02.sol';
import './OctoPin.sol';

contract OctoBay is Ownable, ChainlinkClient, BaseRelayRecipient {

    function _msgSender() internal override(Context, BaseRelayRecipient)
    view returns (address payable) {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal override(Context,BaseRelayRecipient)
    view returns (bytes memory ret) {
        return BaseRelayRecipient._msgData();
    }

    string public override versionRecipient = '2.0.0'; // GSN version

    IUniswapV2Router02 uniswap;
    // TODO: Add more events related to user withdrawls
    event UserDepositEvent(address account, uint256 amount, string githubUser);
    event UserSendEvent(address account, uint256 amount, string githubUser);
    event IssueDepositEvent(address account, uint256 amount, string issueId);
    event ReleaseIssueDepositsEvent(string issueId, string githubUser);
    event TwitterPost(bytes32 requestId, bytes32 tweetId);

    struct User {
        string githubUser;
        address ethAddress;
        uint8 status; // 1 = requested, 2 = confirmed
    }
    mapping(bytes32 => User) public users;
    mapping(address => bytes32) public userIDsByAddress;
    mapping(string => bytes32) public userIDsByGithubUser;
    mapping(string => uint256) public userClaimAmountByGithbUser;

    struct UserDeposit {
        address from;
        uint256 amount;
        string githubUser;
    }
    uint256 private nextUserDepositId = 0;
    mapping(uint256 => UserDeposit) public userDeposits;
    mapping(string => uint256[]) public userDepositIdsByGithubUser;
    mapping(address => uint256[]) public userDepositIdsBySender;

    struct IssueDeposit {
        address from;
        uint256 amount;
        string issueId;
    }
    mapping(uint256 => IssueDeposit) public issueDeposits;
    uint256 public nextIssueDepositId = 0;
    mapping(string => uint256[]) public issueDepositIdsByIssueId;
    mapping(address => uint256[]) public issueDepositIdsBySender;
    mapping(string => uint256) public issueDepositsAmountByIssueId;

    struct ReleasedIssue {
        string githubUser;
        string issueId;
        uint256 status;
    }
    mapping(bytes32 => ReleasedIssue) public releasedIssues;
    mapping(string => bytes32) public issueReleaseIDsByIssueId;

    struct PullRequestClaim {
        string githubUser;
        string prId;
        uint256 status; // 1 = requested, 2 = confirmed
    }
    mapping(bytes32 => PullRequestClaim) public pullRequestClaims;
    mapping(string => bytes32) public pullRequestClaimIDsByPrId;

    mapping(string => uint256) public issuePins;

    address[] public oracleAddresses;
    mapping(address => string) public oracleNames;
    mapping(address => bytes32) public registerJobIds;
    mapping(address => uint256) public registerJobFees;
    mapping(address => bytes32) public releaseJobIds;
    mapping(address => uint256) public releaseJobFees;
    mapping(address => bytes32) public claimJobIds;
    mapping(address => uint256) public claimJobFees;
    mapping(address => bytes32) public twitterPostJobIds;
    mapping(address => uint256) public twitterPostJobFees;
    mapping(address => bytes32) public twitterFollowersJobIds;
    mapping(address => uint256) public twitterFollowersJobFees;


    address weth;
    address link;
    OctoPin public octoPin;
    address octobayPaymaster;

    string twitterAccountId;
    uint256 public twitterFollowers;
    mapping(bytes32 => string) public pendingTwitterPostsIssueIds;

    constructor(
        address _link,
        address _weth,
        address _uniswap,
        address _forwarder
    ) public {
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
        link = _link;
        weth = _weth;
        trustedForwarder = _forwarder; // GSN trusted forwarder
        uniswap = IUniswapV2Router02(_uniswap);
    }

    function setOctoPin(address _octoPin) external onlyOwner {
        octoPin = OctoPin(_octoPin);
    }

    function setPaymaster(address _octobayPaymaster) external onlyOwner {
        octobayPaymaster = _octobayPaymaster;
    }

    function setTwitterAccountId(string memory _accountId) external onlyOwner {
        twitterAccountId = _accountId;
        twitterFollowers = 0;
    }

    modifier onlyActiveOracles(address _oracle) {
      require(bytes(oracleNames[_oracle]).length > 0, "Only whitelisted oracles can be used for this request.");
      _;
    }

    function setOracle(address _oracle, string calldata name) external onlyOwner {
      oracleAddresses.push(_oracle);
      oracleNames[_oracle] = name;
    }

    function setOracleJob(address _oracle, uint256 _jobType, bytes32 _jobId, uint256 _jobFee) external onlyOwner {
      if (_jobType == 1) {
        registerJobIds[_oracle] = _jobId;
        registerJobFees[_oracle] = _jobFee;
      } else if (_jobType == 2) {
        releaseJobIds[_oracle] = _jobId;
        releaseJobFees[_oracle] = _jobFee;
      } else if (_jobType == 3) {
        claimJobIds[_oracle] = _jobId;
        claimJobFees[_oracle] = _jobFee;
      } else if (_jobType == 4) {
        twitterPostJobIds[_oracle] = _jobId;
        twitterPostJobFees[_oracle] = _jobFee;
      } else if (_jobType == 5) {
        twitterFollowersJobIds[_oracle] = _jobId;
        twitterFollowersJobFees[_oracle] = _jobFee;
      }
    }

    function removeOracle(address _oracle) external onlyOwner {
      delete oracleNames[_oracle];
      delete registerJobIds[_oracle];
      delete registerJobFees[_oracle];
      delete releaseJobIds[_oracle];
      delete releaseJobFees[_oracle];
      delete claimJobIds[_oracle];
      delete claimJobFees[_oracle];
      delete twitterPostJobIds[_oracle];
      delete twitterPostJobFees[_oracle];
      delete twitterFollowersJobIds[_oracle];
      delete twitterFollowersJobFees[_oracle];

      uint i = 0;
      while (oracleAddresses[i] != _oracle) {
        i++;
      }
      while (i < oracleAddresses.length - 1) {
        oracleAddresses[i] = oracleAddresses[i + 1];
        i++;
      }
      oracleAddresses.pop();
    }

    function getOracles() external view returns(address[] memory) {
      return oracleAddresses;
    }

    function deductGasFee(string memory _githubUser, uint256 _amount)
        external
    {
        // only paymaster, cause paymaster pays for gas fee on behalf of user
        require(msg.sender == octobayPaymaster);
        require(userClaimAmountByGithbUser[_githubUser] >= _amount, 'Not enough funds to pay gasFee');

        userClaimAmountByGithbUser[_githubUser] -= _amount;
    }


    function _swapETHforLink(uint256 _ethAmount, uint256 _linkAmount)
        internal
        returns (uint256 _ethOut)
    {
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = link;

        uint256[] memory amounts =
            uniswap.swapETHForExactTokens{value: _ethAmount}(
                _linkAmount, // amountOut
                path,
                address(this),
                now
            );
    }

    // ------------ USER ONBOARDING ------------ //

    function register(
        address _oracle,
        string memory _githubUser
    ) public onlyActiveOracles(_oracle) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                registerJobIds[_oracle],
                address(this),
                this.confirmRegistration.selector
            );
        request.add('githubUser', _githubUser);
        request.add('ethAddress', addressToIntString(_msgSender()));
        bytes32 requestId =
            sendChainlinkRequestTo(_oracle, request, registerJobFees[_oracle]);

        users[requestId] = User(_githubUser, _msgSender(), 1);
    }

    function confirmRegistration(bytes32 _requestId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        // If githubUser was registered before (changed ethAddress now) look for old
        // ID and delete entry in userIDsByAddress as well as users entry itself (userIDsByGithubUser
        // has been overridden above anyway).
        bytes32 oldId = userIDsByGithubUser[users[_requestId].githubUser];
        delete userIDsByAddress[users[oldId].ethAddress];
        delete users[oldId];
        // The scenario where an eth address switches to a new github account
        // (the other way around) does not occur.

        users[_requestId].status = 2;
        userIDsByAddress[users[_requestId].ethAddress] = _requestId;
        userIDsByGithubUser[users[_requestId].githubUser] = _requestId;
    }

    // ------------ TWITTER POST ------------ //

    function twitterPost(
        address _oracle,
        string memory _issueId
    ) internal onlyActiveOracles(_oracle) returns(bytes32 requestId) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                twitterPostJobIds[_oracle],
                address(this),
                this.twitterPostConfirm.selector
            );
        request.add('issueId', _issueId);
        request.addUint('amount', issueDepositsAmountByIssueId[_issueId]);
        requestId = sendChainlinkRequestTo(_oracle, request, twitterPostJobFees[_oracle]);
    }

    function twitterPostConfirm(bytes32 _requestId, bytes32 _tweetId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit TwitterPost(_requestId, _tweetId);
    }

    // ------------ TWITTER FOLLOWERS ------------ //

    function updateTwitterFollowersAndPost(
        address _oracle,
        string memory _issueId
    ) public onlyActiveOracles(_oracle) returns(bytes32 requestId) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                twitterFollowersJobIds[_oracle],
                address(this),
                this.updateTwitterFollowersConfirm.selector
            );
        request.add('accountId', twitterAccountId);
        requestId = sendChainlinkRequestTo(_oracle, request, twitterFollowersJobFees[_oracle]);
        pendingTwitterPostsIssueIds[requestId] = _issueId;
    }

    function updateTwitterFollowersConfirm(bytes32 _requestId, uint256 _followers)
        public
        recordChainlinkFulfillment(_requestId)
    {
        twitterFollowers = _followers;
        twitterPost(msg.sender, pendingTwitterPostsIssueIds[_requestId]);
        delete pendingTwitterPostsIssueIds[_requestId];
    }

    // ------------ USER DEPOSITS ------------ //

    function depositEthForGithubUser(string calldata _githubUser)
        external
        payable
    {
        require(msg.value > 0, 'You must send ETH.');
        User memory user = users[userIDsByGithubUser[_githubUser]];

        if(user.ethAddress != address(0) && user.status == 2) { // Registered and verified user
            payable(users[userIDsByGithubUser[_githubUser]].ethAddress).transfer(
                msg.value
            );

            emit UserSendEvent(msg.sender, msg.value, _githubUser);

        } else {    // hold funds in contract
            nextUserDepositId++;
            userDeposits[nextUserDepositId] = UserDeposit(
                msg.sender,
                msg.value,
                _githubUser
            );
            userDepositIdsByGithubUser[_githubUser].push(nextUserDepositId);
            userDepositIdsBySender[msg.sender].push(nextUserDepositId);

            // increment claim amount
            userClaimAmountByGithbUser[_githubUser] += msg.value;

            emit UserDepositEvent(msg.sender, msg.value, _githubUser);
        }
    }

    function _sendDeposit(uint256 _depositId, address _to) internal {
        UserDeposit memory deposit = userDeposits[_depositId];
        payable(_to).transfer(deposit.amount);

        // reduce claim amount
        userClaimAmountByGithbUser[deposit.githubUser] -= deposit.amount;

        delete userDeposits[_depositId];
    }


    function refundUserDeposit(uint256 _depositId) external {
        require(
            userDeposits[_depositId].from == msg.sender,
            'Deposit did not came from this Ethereum address.'
        );
        _sendDeposit(_depositId, msg.sender);   // msg.sender is depositor
    }


    // ------------ USER WITHDRAWALS ------------ //


    function withdrawUserDeposit(uint256 _depositId) external {
        require(
            users[userIDsByAddress[msg.sender]].ethAddress == msg.sender,
            'This Ethereum address is not registered with any GitHub user.'
        );
        require(
            keccak256(bytes(userDeposits[_depositId].githubUser)) ==
                keccak256(
                    bytes(users[userIDsByAddress[msg.sender]].githubUser)
                ),
            'Deposit is not for this GitHub account.'
        );
        _sendDeposit(_depositId, msg.sender);   // msg.sender is user
    }



    // ------------ ISSUE DEPOSITS ------------ //

    function depositEthForIssue(string calldata _issueId) external payable {
        require(msg.value > 0, 'You must send ETH.');
        nextIssueDepositId++;
        issueDeposits[nextIssueDepositId] = IssueDeposit(
            msg.sender,
            msg.value,
            _issueId
        );
        issueDepositIdsByIssueId[_issueId].push(nextIssueDepositId);
        issueDepositIdsBySender[msg.sender].push(nextIssueDepositId);
        issueDepositsAmountByIssueId[_issueId] += msg.value;
        emit IssueDepositEvent(msg.sender, msg.value, _issueId);
    }

    function refundIssueDeposit(uint256 _depositId) external {
        require(
            issueDeposits[_depositId].from == msg.sender,
            'Deposit did not come from this Ethereum address or does not exist.'
        );
        require(
            issueDepositsAmountByIssueId[issueDeposits[_depositId].issueId] >=
                issueDeposits[_depositId].amount,
            'This issue deposit has been withdrawn already.'
        );
        payable(msg.sender).transfer(issueDeposits[_depositId].amount);
        issueDepositsAmountByIssueId[
            issueDeposits[_depositId].issueId
        ] -= issueDeposits[_depositId].amount;
        delete issueDeposits[_depositId];
    }


    // ------------ ISSUE-DEPOSIT RELEASES ------------ //

    function releaseIssueDeposits(
        address _oracle,
        string memory _issueId,
        string memory _githubUser
    ) public onlyActiveOracles(_oracle) {
        require(
            issueDepositsAmountByIssueId[_issueId] > 0,
            'Issue has no deposits to release.'
        );
        require(
            users[userIDsByAddress[msg.sender]].ethAddress == msg.sender,
            'Only registered GitHub users can release issue deposits.'
        );

        Chainlink.Request memory request =
            buildChainlinkRequest(
                releaseJobIds[_oracle],
                address(this),
                this.confirmReleaseIssueDeposits.selector
            );
        request.add('githubUser', _githubUser);
        request.add('issueId', _issueId);
        bytes32 requestId =
            sendChainlinkRequestTo(_oracle, request, releaseJobFees[_oracle]);

        releasedIssues[requestId] = ReleasedIssue(_githubUser, _issueId, 1);
        issueReleaseIDsByIssueId[_issueId] = requestId;
    }

    function confirmReleaseIssueDeposits(bytes32 _requestId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(
            releasedIssues[_requestId].status == 1,
            'Isse deposit release was not requested.'
        );
        releasedIssues[_requestId].status = 2;

        // add released issue funds to user deposits
        userClaimAmountByGithbUser[releasedIssues[_requestId].githubUser] +=
            issueDepositsAmountByIssueId[releasedIssues[_requestId].issueId];

        emit ReleaseIssueDepositsEvent(
            releasedIssues[_requestId].issueId,
            releasedIssues[_requestId].githubUser
        );
    }

    function claimReleasedIssueDeposits(string calldata _issueId) external {
        require(
            users[userIDsByAddress[msg.sender]].ethAddress == msg.sender,
            'No GitHub account registered with this Ethereum account.'
        );
        require(
            keccak256(
                bytes(
                    releasedIssues[issueReleaseIDsByIssueId[_issueId]]
                        .githubUser
                )
            ) ==
                keccak256(
                    bytes(users[userIDsByAddress[msg.sender]].githubUser)
                ),
            'The GitHub account this issue was released to does not belong to this Ethereum account.'
        );
        require(
            issueDepositsAmountByIssueId[_issueId] > 0,
            'Issue deposits already claimed.'
        );

        payable(msg.sender).transfer(issueDepositsAmountByIssueId[_issueId]);
        // subtract released issue funds from user deposits
        userClaimAmountByGithbUser[users[userIDsByAddress[msg.sender]].githubUser] -=
            issueDepositsAmountByIssueId[_issueId];

        issueDepositsAmountByIssueId[_issueId] = 0;
    }

    // ------------ PULL REQUESTS ------------ //

    function claimPullRequest(
        address _oracle,
        string memory _prId,
        string memory _githubUser
    ) public onlyActiveOracles(_oracle) {
        require(
            pullRequestClaims[pullRequestClaimIDsByPrId[_prId]].status != 2,
            'Pull request already claimed.'
        );
        require(
            users[userIDsByGithubUser[_githubUser]].status == 2,
            'This GitHub user is not registered.'
        );

        Chainlink.Request memory request =
            buildChainlinkRequest(
                claimJobIds[_oracle],
                address(this),
                this.confirmPullRequestClaim.selector
            );
        request.add('githubUser', _githubUser);
        request.add('prId', _prId);
        bytes32 requestId = sendChainlinkRequestTo(_oracle, request, claimJobFees[_oracle]);

        pullRequestClaims[requestId] = PullRequestClaim(_githubUser, _prId, 1);
    }

    function confirmPullRequestClaim(bytes32 _requestId, uint256 _score)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(
            1 <= _score && _score <= 100,
            'Invalid score: 1 <= score <= 100'
        );
        require(
            pullRequestClaims[_requestId].status == 1,
            'Pull request claim was not requested.'
        );
        require(
            users[userIDsByGithubUser[pullRequestClaims[_requestId].githubUser]]
                .ethAddress != address(0),
            'This GitHub user is not registered.'
        );

        pullRequestClaims[_requestId].status = 2;
        octoPin.mintOnPullRequestClaim(
            users[userIDsByGithubUser[pullRequestClaims[_requestId].githubUser]]
                .ethAddress,
            _score * uint256(10)**octoPin.decimals()
        );
    }


    // ------------ GETTERS ------------ //

     function getUserDepositIdsForGithubUser(string calldata _githubUser)
        external
        view
        returns (uint256[] memory)
    {
        return userDepositIdsByGithubUser[_githubUser];
    }

    function getUserDepositIdsForSender()
        external
        view
        returns (uint256[] memory)
    {
        return userDepositIdsBySender[msg.sender];
    }

    function getIssueDepositIdsForIssueId(string calldata _depositId)
        external
        view
        returns (uint256[] memory)
    {
        return issueDepositIdsByIssueId[_depositId];
    }

    function getIssueDepositIdsForSender()
        external
        view
        returns (uint256[] memory)
    {
        return issueDepositIdsBySender[msg.sender];
    }

    function getUserClaimAmount(string memory _githubUser)
        external
        view
        returns (uint256)
    {
        return userClaimAmountByGithbUser[_githubUser];
    }


    // ------------ UTILS ------------ //

    function addressToIntString(address _address)
        internal
        pure
        returns (string memory _string)
    {
        uint256 _i = uint256(_address);
        if (_i == 0) {
            return '0';
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }
}
