// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.6/ChainlinkClient.sol';
import '@opengsn/gsn/contracts/BaseRelayRecipient.sol';
import '@opengsn/gsn/contracts/BasePaymaster.sol';
import './OctobayVisibilityToken.sol';
import './UserAddressStorage.sol';
import './OracleStorage.sol';
import './OctobayGovernor.sol';
import './OctobayGovTokenFactory.sol';

contract Octobay is Ownable, ChainlinkClient, BaseRelayRecipient {

    // TODO: Add more events related to user withdrawls
    event IssueDepositEvent(address from, uint256 amount, string issueId, uint256 depositId);
    event TwitterPostEvent(string issueId, bytes32 tweetId);

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

    mapping(string => uint256) public issuePins;

    OctobayVisibilityToken public ovt;

    string public twitterAccountId;
    uint256 public twitterFollowers;
    mapping(bytes32 => string) public pendingTwitterPostsIssueIds;

    constructor(
        address _link,
        address _forwarder,
        address _ovt,
        address _userAddressStorage,
        address _oracleStorage,
        address _octobayGovernor,
        address _octobayGovTokenFactory
    ) public {
        setChainlinkToken(_link);
        trustedForwarder = _forwarder; // GSN trusted forwarder
        userAddressStorage = UserAddressStorage(_userAddressStorage);
        oracleStorage = OracleStorage(_oracleStorage);
        ovt = OctobayVisibilityToken(_ovt);
        octobayGovernor = OctobayGovernor(_octobayGovernor);
        octobayGovTokenFactory = OctobayGovTokenFactory(_octobayGovTokenFactory);
    }

    function setTwitterAccountId(string memory _accountId) external onlyOwner {
        twitterAccountId = _accountId;
        twitterFollowers = 0;
    }

    function pinIssue(string memory _issueId, uint256 _amount) public {
        require(_amount > 0, 'Amount must be greater zero.');
        ovt.burn(msg.sender, _amount);
        issuePins[_issueId] += _amount;
    }





    // ------------ Oracles ------------ //


    OracleStorage public oracleStorage;

    modifier oracleHandlesJob(address _oracle, string memory _jobName) {
        require(oracleStorage.oracleExists(_oracle), "Oracle does not exist.");
        require(oracleStorage.oracleJobExists(_oracle, _jobName), "Oracle job does not exist.");
        _;
    }

    function addOracle(
        address _oracle,
        string calldata _name,
        string[] memory _jobNames,
        OracleStorage.Job[] memory _jobs
    ) external onlyOwner {
        oracleStorage.addOracle(_oracle, _name, _jobNames, _jobs);
    }

    function removeOracle(address _oracle) external onlyOwner {
        oracleStorage.removeOracle(_oracle);
    }

    function changeOracleName(address _oracle, string calldata _name) external onlyOwner {
        oracleStorage.changeOracleName(_oracle, _name);
    }

    function addOracleJob(
        address _oracle,
        string calldata _jobName,
        OracleStorage.Job memory _job
    ) external onlyOwner {
        oracleStorage.addOracleJob(_oracle, _jobName, _job);
    }

    function removeOracleJob(address _oracle, string calldata _jobName) external onlyOwner {
        oracleStorage.removeOracleJob(_oracle, _jobName);
    }
    




    // ------------ GSN ------------ //


    address octobayPaymaster;

    function setPaymaster(address _octobayPaymaster) external onlyOwner {
        octobayPaymaster = _octobayPaymaster;
    }

    function _msgSender() internal override(Context, BaseRelayRecipient)
    view returns (address payable) {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal override(Context, BaseRelayRecipient)
    view returns (bytes memory ret) {
        return BaseRelayRecipient._msgData();
    }

    string public override versionRecipient = '2.0.0'; // GSN version

    function deductGasFee(string calldata _githubUserId, uint256 _amount)
        external
    {
        // only paymaster, cause paymaster pays for gas fee on behalf of user
        require(msg.sender == octobayPaymaster);
        require(userClaimAmountByGithbUserId[_githubUserId] >= _amount, 'Not enough funds to pay gasFee');

        userClaimAmountByGithbUserId[_githubUserId] -= _amount;
    }





    // ------------ REGISTRATION ------------ //


    UserAddressStorage public userAddressStorage;

    struct UserAddressRegistration {
        string githubUserId;
        address ethAddress;
    }

    mapping(bytes32 => UserAddressRegistration) public userAddressRegistrations;

    function registerUserAddress(
        address _oracle,
        string calldata _githubUserId
    ) public oracleHandlesJob(_oracle, 'register') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'register');
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.confirmRegisterUserAddress.selector
            );
        request.add('githubUserId', _githubUserId);
        request.add('ethAddress', addressToIntString(_msgSender()));
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        userAddressRegistrations[requestId] = UserAddressRegistration(_githubUserId, _msgSender());
    }

    function confirmRegisterUserAddress(bytes32 _requestId, bytes32 _addressName)
        public
        recordChainlinkFulfillment(_requestId)
    {
        userAddressStorage.addUserAddress(
            userAddressRegistrations[_requestId].githubUserId,
            _addressName,
            userAddressRegistrations[_requestId].ethAddress
        );

        delete userAddressRegistrations[_requestId];
    }





    // ------------ TWITTER ------------ //


    function twitterPost(
        address _oracle,
        string memory _issueId
    ) internal oracleHandlesJob(_oracle, 'twitterPost') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'twitterPost');
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.twitterPostConfirm.selector
            );
        request.add('issueId', _issueId);
        request.addUint('amount', issueDepositsAmountByIssueId[_issueId]);
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);
    }

    function twitterPostConfirm(bytes32 _requestId, bytes32 _tweetId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit TwitterPostEvent(pendingTwitterPostsIssueIds[_requestId], _tweetId);
    }

    function updateTwitterFollowersAndPost(
        address _oracle,
        string memory _issueId
    ) public oracleHandlesJob(_oracle, 'twitterFollowers') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'twitterFollowers');
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.updateTwitterFollowersConfirm.selector
            );
        request.add('accountId', twitterAccountId);
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);
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


    event UserDepositEvent(address from, uint256 amount, string githubUser);

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

    function withdrawUserDeposit(uint256 _depositId) external {
        require(
            keccak256(bytes(userDeposits[_depositId].githubUserId)) ==
                keccak256(
                    bytes(userAddressStorage.userIdsByAddress(msg.sender))
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





    // ------------ GOVERNANCE ------------ //


    OctobayGovernor public octobayGovernor;
    OctobayGovTokenFactory public octobayGovTokenFactory;

    struct NewGovernanceToken {
        bool isValue;
        string githubUserId;
        string name;
        string symbol;
        string projectId;
        uint16 newProposalReq;
    }

    mapping(bytes32 => NewGovernanceToken) public newGovernanceTokenReqs;

    // Using a struct as arg here otherwise we get stack too deep errors
    function createGovernanceToken(
        address _oracle,
        NewGovernanceToken memory _newToken
    ) public oracleHandlesJob(_oracle, 'check-ownership') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'check-ownership');
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.confirmCreateGovernanceToken.selector
            );
        request.add('githubUserId', _newToken.githubUserId);
        request.add('repoOrgId', _newToken.projectId); // Which one should we use to keep these in sync? 
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        newGovernanceTokenReqs[requestId] = _newToken;
    }

    function confirmCreateGovernanceToken(bytes32 _requestId, bool _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(_result, "User is not owner of organization or repository");
        NewGovernanceToken memory newToken = newGovernanceTokenReqs[_requestId];
        require(newToken.isValue, "No such request");
        delete newGovernanceTokenReqs[_requestId];

        octobayGovTokenFactory.createToken(newToken.name, newToken.symbol, newToken.projectId);
        octobayGovernor.createGovernor(newToken.projectId, newToken.newProposalReq);
    }





    // ------------ GETTERS ------------ //


     function getUserDepositIdsForGithubUserId(string calldata _githubUserId)
        external
        view
        returns (uint256[] memory)
    {
        return userDepositIdsByGithubUserId[_githubUserId];
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

    function getUserClaimAmount(string calldata _githubUserId)
        external
        view
        returns (uint256)
    {
        return userClaimAmountByGithbUserId[_githubUserId];
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
