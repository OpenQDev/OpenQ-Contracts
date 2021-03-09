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
import './Oracles.sol';

contract OctoBay is Ownable, ChainlinkClient, BaseRelayRecipient {

    function _msgSender() internal override(Context, BaseRelayRecipient)
    view returns (address payable) {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal override(Context, BaseRelayRecipient)
    view returns (bytes memory ret) {
        return BaseRelayRecipient._msgData();
    }

    string public override versionRecipient = '2.0.0'; // GSN version

    IUniswapV2Router02 uniswap;
    // TODO: Add more events related to user withdrawls
    event UserDepositEvent(address from, uint256 amount, string githubUser);
    event IssueDepositEvent(address from, uint256 amount, string issueId, uint256 depositId);
    event TwitterPostEvent(string issueId, bytes32 tweetId);

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
        address _userAddresses,
        address _oracles
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
        oracles = Oracles(_oracles);
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

    Oracles oracles;

    modifier oracleHandlesJob(address _oracle, string memory _jobName) {
        require(oracles.oracleExists(_oracle), "Oracle does not exist.");
        require(oracles.oracleJobExists(_oracle, _jobName), "Oracle job does not exist.");
        _;
    }
    

    // ------------ PAYMASTER ------------ //

    function deductGasFee(string memory _githubUserId, uint256 _amount)
        external
    {
        // only paymaster, cause paymaster pays for gas fee on behalf of user
        require(msg.sender == octobayPaymaster);
        require(userClaimAmountByGithbUserId[_githubUserId] >= _amount, 'Not enough funds to pay gasFee');

        userClaimAmountByGithbUserId[_githubUserId] -= _amount;
    }

    // ------------ USER ONBOARDING ------------ //

    function registerUserAddress(
        address _oracle,
        string calldata _githubUserId
    ) public oracleHandlesJob(_oracle, 'register') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracles.getOracleJob(_oracle, 'register');
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

    function confirmRegisterUserAddress(bytes32 _requestId, string calldata _addressName)
        public
        recordChainlinkFulfillment(_requestId)
    {
        userAddresses.addUserAddress(
            userAddressRegistrations[_requestId].githubUserId,
            _addressName,
            userAddressRegistrations[_requestId].ethAddress
        );
    }

    // ------------ TWITTER POST ------------ //

    function twitterPost(
        address _oracle,
        string memory _issueId
    ) internal oracleHandlesJob(_oracle, 'twitterPost') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracles.getOracleJob(_oracle, 'twitterPost');
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

    // ------------ TWITTER FOLLOWERS ------------ //

    function updateTwitterFollowersAndPost(
        address _oracle,
        string memory _issueId
    ) public oracleHandlesJob(_oracle, 'twitterFollowers') returns(bytes32 requestId) {
        (bytes32 jobId, uint256 jobFee) = oracles.getOracleJob(_oracle, 'twitterFollowers');
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

    function getUserClaimAmount(string memory _githubUserId)
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
