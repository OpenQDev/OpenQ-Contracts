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
import './UserAddresses.sol';

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
    event UserDepositEvent(address from, uint256 amount, string githubUser);
    event IssueDepositEvent(address from, uint256 amount, string issueId, uint256 depositId);
    event ReleaseIssueDepositsEvent(string issueId, string githubUser);
    event TwitterPostEvent(string issueId, bytes32 tweetId);
    event UserAddressRegisteredEvent(string githubUserId, string addressName, address ethAddress);

    UserAddresses userAddresses;
    struct UserAddressRegistration {
        string githubUserId;
        address ethAddress;
    }
    mapping(bytes32 => UserAddressRegistration) public userAddressRegistrations;
    mapping(string => uint256) public userClaimAmountByGithbUserId;

    struct UserDeposit {
        address from;
        uint256 amount;
        string githubUserId;
    }
    uint256 private nextUserDepositId = 0;
    mapping(uint256 => UserDeposit) public userDeposits;
    mapping(string => uint256[]) public userDepositIdsByGithubUserId;
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
        address _forwarder,
        address _userAddresses
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
        userAddresses = UserAddresses(_userAddresses);
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

    event OracleAddedEvent(address oracle, string name);
    event OracleRemovedEvent(address oracle);
    event OracleNameChangedEvent(address oracle, string name);
    event OracleJobAddedEvent(address oracle, jobName name);
    event OracleJobRemovedEvent(address oracle, jobName name);

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

      emit OracleAddedEvent(_oracle, _name);
    }

    function removeOracle(address _oracle) external onlyOwner onlyRegisteredOracle(_oracle) {
        delete oracles[_oracle];
        for(uint i = 0; i < registeredOracles.length; i++ ) {
            if(registeredOracles[i] == _oracle) {
                registeredOracles[i] = registeredOracles[registeredOracles.length -1];
                registeredOracles.pop();
            }
        }
        emit OracleRemovedEvent(_oracle);
    }

    function changeOracleName(address _oracle, string calldata _name) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can change name');
        oracles[_oracle].name = _name;
        emit OracleNameChangedEvent(_oracle, _name);
    }

    function addOracleJob(address _oracle, jobName _jobName, Job memory _job) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can add job');
        oracles[_oracle].jobs[_jobName] = _job;
        emit OracleJobAddedEvent(_oracle, _jobName);
    }

    function removeOracleJob(address _oracle, jobName _jobName) external onlyRegisteredOracle(_oracle) {
        require(msg.sender == owner() || msg.sender == _oracle, 'Only oracle or owner can add job');
        delete oracles[_oracle].jobs[_jobName];
        emit OracleJobRemovedEvent(_oracle, _jobName);
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
        require(userClaimAmountByGithbUserId[_githubUser] >= _amount, 'Not enough funds to pay gasFee');

        userClaimAmountByGithbUserId[_githubUser] -= _amount;
    }

    // ------------ USER ONBOARDING ------------ //

    function registerUserAddress(
        address _oracle,
        string calldata _githubUserId
    ) public oracleHandlesJob(_oracle, jobName.register) returns(bytes32 requestId) {
        Chainlink.Request memory request =
            buildChainlinkRequest(
                oracles[_oracle].jobs[jobName.register].id,
                address(this),
                this.confirmRegisterUserAddress.selector
            );
        request.add('githubUserId', _githubUserId);
        request.add('ethAddress', addressToIntString(_msgSender()));
        requestId = sendChainlinkRequestTo(_oracle, request, oracles[_oracle].jobs[jobName.register].fee);

        userAddressRegistrations[requestId] = UserAddressRegistration(_githubUserId, _msgSender());
    }

    function confirmRegisterUserAddress(bytes32 _requestId, string calldata _addressName)
        public
        recordChainlinkFulfillment(_requestId)
    {
        userAddresses.addUserAddress(
            userAddressRegistrations[_requestId].githubUserId,
            _addressName,
            userAddressRegistrations[_requestId].ethAddress
        );

        emit UserAddressRegisteredEvent(
            userAddressRegistrations[_requestId].githubUserId,
            _addressName,
            userAddressRegistrations[_requestId].ethAddress
        );
    }

    // ------------ TWITTER POST ------------ //

    function twitterPost(
        address _oracle,
        string memory _issueId
    ) internal oracleHandlesJob(_oracle, jobName.twitterPost) returns(bytes32 requestId) {
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
        emit TwitterPostEvent(pendingTwitterPostsIssueIds[_requestId], _tweetId);
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

    function depositEthForGithubUser(string calldata _githubUserId)
        external
        payable
    {
        require(msg.value > 0, 'You must send ETH.');

        nextUserDepositId++;
        userDeposits[nextUserDepositId] = UserDeposit(
            msg.sender,
            msg.value,
            _githubUserId
        );
        userDepositIdsByGithubUserId[_githubUserId].push(nextUserDepositId);
        userDepositIdsBySender[msg.sender].push(nextUserDepositId);

        // increment claim amount
        userClaimAmountByGithbUserId[_githubUserId] += msg.value;

        emit UserDepositEvent(msg.sender, msg.value, _githubUserId);
    }

    function _sendDeposit(uint256 _depositId, address _to) internal {
        UserDeposit memory deposit = userDeposits[_depositId];
        payable(_to).transfer(deposit.amount);

        // reduce claim amount
        userClaimAmountByGithbUserId[deposit.githubUserId] -= deposit.amount;

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
            keccak256(bytes(userDeposits[_depositId].githubUserId)) ==
                keccak256(
                    bytes(userAddresses.userIdsByAddress(msg.sender))
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
        emit IssueDepositEvent(msg.sender, msg.value, _issueId, nextIssueDepositId);
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


    // ------------ GETTERS ------------ //

     function getUserDepositIdsForGithubUser(string calldata _githubUser)
        external
        view
        returns (uint256[] memory)
    {
        return userDepositIdsByGithubUserId[_githubUser];
    }

    function getUserDepositIdsForSender()
        external
        view
        returns (uint256[] memory)
    {
        return userDepositIdsBySender[msg.sender];
    }

    function getIssueDepositIdsForIssueId(string calldata _issueId)
        external
        view
        returns (uint256[] memory)
    {
        return issueDepositIdsByIssueId[_issueId];
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
        return userClaimAmountByGithbUserId[_githubUser];
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
