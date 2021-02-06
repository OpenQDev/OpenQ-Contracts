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
    event IssueDepositEvent(uint256 depositId, address account, uint256 amount, string issueId);
    event ReleaseIssueDepositsEvent(string issueId, string githubUser);
    event TwitterPost(string issueId, bytes32 tweetId);

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

    address weth;
    address link;
    OctoPin public octoPin;
    address octobayPaymaster;

    string public twitterAccountId;
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
    
     // ------------ ORACLES ------------ //
     
    event OracleAdded(address _oracle, string name);
    event OracleRemoved(address _oracle);
    
    enum jobName { register, release, claim, twitterPost, twitterFollowers }
    
    struct Job {
        bytes32 id;
        uint256 fee;
    }
    
    struct Oracle{
        string name;
        mapping(jobName => Job) jobs;
    }
    
    address[] public registeredOracles;
    mapping(address => Oracle) public oracles;

    modifier onlyRegisteredOracle(address _oracle) {
      require(bytes(oracles[_oracle].name).length > 0, "Unregistered oracle");
      _;
    }
    
    modifier oracleHandlesJob(address _oracle, jobName _jobName) {
        require(bytes(oracles[_oracle].name).length > 0, "Unregistered oracle");
        require(oracles[_oracle].jobs[_jobName].id > 0, "Oracle doesn't do this job");
        _;
    }
    
    function addOracle(address _oracle, string calldata _name, jobName[] memory _jobNames, Job[] memory _jobs) external onlyOwner {
      require(bytes(oracles[_oracle].name).length == 0, 'Oracle already exists');
      require(_jobs.length > 0, 'No Jobs');
      require(_jobNames.length == _jobs.length, '_jobNames and _jobs should be of same length');
    
      oracles[_oracle] = Oracle({
          name: _name
      });
      for(uint i = 0; i < _jobNames.length; i++) {
          oracles[_oracle].jobs[_jobNames[i]] = _jobs[i];   // modifies the stroage
      }
      registeredOracles.push(_oracle);
      
      emit OracleAdded(_oracle, _name);
    }
    
    function removeOracle(address _oracle) external onlyOwner onlyRegisteredOracle(_oracle) {
        delete oracles[_oracle];
        for(uint i = 0; i < registeredOracles.length; i++ ) {
            if(registeredOracles[i] == _oracle) {
                registeredOracles[i] = registeredOracles[registeredOracles.length -1];
                registeredOracles.pop();
            }
        }
        emit OracleRemoved(_oracle);
    }

    function changeOracleName(address _oracle, string calldata _name) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can change name');
        oracles[_oracle].name = _name;
    }
    
    function addOracleJob(address _oracle, jobName _jobName, Job memory _job) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can add job');
        oracles[_oracle].jobs[_jobName] = _job;
    }
    
    function removeOracleJob(address _oracle, jobName _jobName) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can add job');
        delete oracles[_oracle].jobs[_jobName];
    }
    
    function getOracleName(address _oracle) external view returns (string memory) {
        return oracles[_oracle].name;
    }
    
    function getOracleJob(address _oracle, jobName _job) external view returns (bytes32, uint256) {
        Job memory job = oracles[_oracle].jobs[_job];
        return (job.id, job.fee); 
    }
    
    // ------------ PAYMASTER ------------ //
    
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
    ) public oracleHandlesJob(_oracle, jobName.register) returns(bytes32 requestId) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                oracles[_oracle].jobs[jobName.register].id,
                address(this),
                this.confirmRegistration.selector
            );
        request.add('githubUser', _githubUser);
        request.add('ethAddress', addressToIntString(_msgSender()));
        bytes32 requestId =
            sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.register].fee);

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
    ) internal oracleHandlesJob(_oracle, jobName.twitterPost) returns(bytes32 requestId) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                oracles[_oracle].jobs[jobName.twitterPost].id,
                address(this),
                this.twitterPostConfirm.selector
            );
        request.add('issueId', _issueId);
        request.addUint('amount', issueDepositsAmountByIssueId[_issueId]);
        requestId = sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.twitterPost].fee);
    }

    function twitterPostConfirm(bytes32 _requestId, bytes32 _tweetId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit TwitterPost(pendingTwitterPostsIssueIds[_requestId], _tweetId);
    }

    // ------------ TWITTER FOLLOWERS ------------ //

    function updateTwitterFollowersAndPost(
        address _oracle,
        string memory _issueId
    ) public oracleHandlesJob(_oracle, jobName.twitterFollowers) returns(bytes32 requestId) {
        // Trusted and free oracle
        Chainlink.Request memory request =
            buildChainlinkRequest(
                oracles[_oracle].jobs[jobName.twitterFollowers].id,
                address(this),
                this.updateTwitterFollowersConfirm.selector
            );
        request.add('accountId', twitterAccountId);
        requestId = sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.twitterFollowers].fee);
        pendingTwitterPostsIssueIds[requestId] = _issueId;
    }

    function updateTwitterFollowersConfirm(bytes32 _requestId, uint256 _followers)
        public
        recordChainlinkFulfillment(_requestId)
    {
        twitterFollowers = _followers;
        bytes32 postRequestId = twitterPost(msg.sender, pendingTwitterPostsIssueIds[_requestId]);
        pendingTwitterPostsIssueIds[postRequestId] = pendingTwitterPostsIssueIds[_requestId];
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
        emit IssueDepositEvent(nextIssueDepositId, msg.sender, msg.value, _issueId);
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
    ) public oracleHandlesJob(_oracle, jobName.release) {
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
                oracles[_oracle].jobs[jobName.release].id,
                address(this),
                this.confirmReleaseIssueDeposits.selector
            );
        request.add('githubUser', _githubUser);
        request.add('issueId', _issueId);
        bytes32 requestId =
            sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.release].fee);

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
    ) public oracleHandlesJob(_oracle, jobName.release) {
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
                oracles[_oracle].jobs[jobName.claim].id,
                address(this),
                this.confirmPullRequestClaim.selector
            );
        request.add('githubUser', _githubUser);
        request.add('prId', _prId);
        bytes32 requestId = sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.claim].fee);

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

    function getOracles() external view returns(address[] memory) {
        return registeredOracles;
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
