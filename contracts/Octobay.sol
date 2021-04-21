// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.6/ChainlinkClient.sol';
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import '@opengsn/gsn/contracts/BaseRelayRecipient.sol';
import '@opengsn/gsn/contracts/BasePaymaster.sol';
import './OctobayVisibilityToken.sol';
import './UserAddressStorage.sol';
import './OracleStorage.sol';
import './OctobayGovToken.sol';
import './OctobayGovernor.sol';
import './OctobayGovNFT.sol';

contract Octobay is Ownable, ChainlinkClient, BaseRelayRecipient {

    // TODO: Add more events related to user withdrawls
    event TwitterPostEvent(string issueId, bytes32 tweetId);

    mapping(string => uint256) public issuePins;

    OctobayVisibilityToken public ovt;

    string public twitterAccountId;
    uint256 public twitterFollowers;
    mapping(bytes32 => string) public pendingTwitterPostsIssueIds;
    AggregatorV3Interface internal ethUSDPriceFeed;

    constructor(
        address _link,
        address _forwarder,
        address _ovt,
        address _userAddressStorage,
        address _oracleStorage,
        address _octobayGovernor,
        address _ethUSDPriceFeed,
        address _octobayGovNFT
    ) public {
        setChainlinkToken(_link);
        trustedForwarder = _forwarder; // GSN trusted forwarder
        userAddressStorage = UserAddressStorage(_userAddressStorage);
        oracleStorage = OracleStorage(_oracleStorage);
        ovt = OctobayVisibilityToken(_ovt);
        octobayGovernor = OctobayGovernor(_octobayGovernor);
        ethUSDPriceFeed = AggregatorV3Interface(_ethUSDPriceFeed);
        octobayGovNFT = OctobayGovNFT(_octobayGovNFT);
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

    // ------------ Set contract addresses ------------ //

    function setTrustedForwarder(address _forwarder) external onlyOwner {
        trustedForwarder = _forwarder; // GSN trusted forwarder
    }

    function setUserAddressStorage(address _userAddressStorage) external onlyOwner {
        userAddressStorage = UserAddressStorage(_userAddressStorage);
    }

    function setOracleStorage(address _oracleStorage) external onlyOwner {
        oracleStorage = OracleStorage(_oracleStorage);
    }

    function setOctobayVisibilityToken(address _ovt) external onlyOwner {
        ovt = OctobayVisibilityToken(_ovt);
    }

    function setOctobayGovernor(address _octobayGovernor) external onlyOwner {
        octobayGovernor = OctobayGovernor(_octobayGovernor);
    }

    function setEthUSDPriceFeed(address _ethUSDPriceFeed) external onlyOwner {
        ethUSDPriceFeed = AggregatorV3Interface(_ethUSDPriceFeed);
    }

    function setOctobayGovNFT(address _octobayGovNFT) external onlyOwner {
        octobayGovNFT = OctobayGovNFT(_octobayGovNFT);
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


    // function twitterPost(
    //     address _oracle,
    //     string memory _issueId
    // ) internal oracleHandlesJob(_oracle, 'twitterPost') returns(bytes32 requestId) {
    //     (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'twitterPost');
    //     Chainlink.Request memory request =
    //         buildChainlinkRequest(
    //             jobId,
    //             address(this),
    //             this.twitterPostConfirm.selector
    //         );
    //     request.add('issueId', _issueId);
    //     request.addUint('amount', issueDepositsAmountByIssueId[_issueId]);
    //     requestId = sendChainlinkRequestTo(_oracle, request, jobFee);
    // }

    // function twitterPostConfirm(bytes32 _requestId, bytes32 _tweetId)
    //     public
    //     recordChainlinkFulfillment(_requestId)
    // {
    //     emit TwitterPostEvent(pendingTwitterPostsIssueIds[_requestId], _tweetId);
    // }

    // function updateTwitterFollowersAndPost(
    //     address _oracle,
    //     string memory _issueId
    // ) public oracleHandlesJob(_oracle, 'twitterFollowers') returns(bytes32 requestId) {
    //     (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'twitterFollowers');
    //     Chainlink.Request memory request =
    //         buildChainlinkRequest(
    //             jobId,
    //             address(this),
    //             this.updateTwitterFollowersConfirm.selector
    //         );
    //     request.add('accountId', twitterAccountId);
    //     requestId = sendChainlinkRequestTo(_oracle, request, jobFee);
    //     pendingTwitterPostsIssueIds[requestId] = _issueId;
    // }

    // function updateTwitterFollowersConfirm(bytes32 _requestId, uint256 _followers)
    //     public
    //     recordChainlinkFulfillment(_requestId)
    // {
    //     twitterFollowers = _followers;
    //     bytes32 postRequestId = twitterPost(msg.sender, pendingTwitterPostsIssueIds[_requestId]);
    //     pendingTwitterPostsIssueIds[postRequestId] = pendingTwitterPostsIssueIds[_requestId];
    //     delete pendingTwitterPostsIssueIds[_requestId];
    // }





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

    OctobayGovNFT public octobayGovNFT;

    event IssueDepositEvent(address from, uint256 amount, string issueId, uint256 depositId);
    event RefundIssueDepositEvent(address to, uint256 amount, string issueId, uint256 depositId);
    event SetGovTokenForIssueEvent(address from, string  issueId, address govTokenAddress, string projectId);

    enum IssueStatus {
        // NOT_VALID, // There's no sense of 'opening' an issue atm, this would be used if so
        OPEN,
        CLAIMED
    }

    struct IssueDeposit {
        address from;
        uint256 amount;
        string issueId;
    }
    mapping(uint256 => IssueDeposit) public issueDeposits;
    uint256 public nextIssueDepositId = 0;
    mapping(string => uint256[]) public issueDepositIdsByIssueId; // Consider removing this? Can be derived from issueDeposits. Unless we need it for deletion.
    mapping(address => uint256[]) public issueDepositIdsBySender;
    mapping(string => uint256) public issueDepositsAmountByIssueId;
    mapping(string => IssueStatus) public issueStatusByIssueId;
    mapping(string => OctobayGovToken) public govTokenByIssueId;

    function depositAndSetGovTokenForIssue(string calldata _issueId, address _govTokenAddress, string calldata _projectId) external payable {
        depositEthForIssue(_issueId);
        setGovTokenForIssue(_issueId, _govTokenAddress, _projectId);
    }

    function setGovTokenForIssue(string calldata _issueId, address _govTokenAddress, string calldata _projectId) public {
        require(issueStatusByIssueId[_issueId] == IssueStatus.OPEN, 'Issue is not OPEN.');
        // Ensure they're giving us a valid gov token
        require(address(octobayGovernor.tokensByProjectId(_projectId)) == _govTokenAddress, "_projectId is not associated with _govTokenAddress");
        bool hasPermission = false;
        uint256 govNFTId = octobayGovNFT.getTokenIDForUserInProject(msg.sender, _projectId);
        if (govNFTId != 0 && octobayGovNFT.hasPermission(govNFTId, OctobayGovNFT.Permission.SET_ISSUE_GOVTOKEN)) {
            hasPermission = true;
        } else {
            // Do other permission checks here, e.g. oracle calls
        }
        require(hasPermission, "You don't have permission to set governance tokens for issues");
        govTokenByIssueId[_issueId] = OctobayGovToken(_govTokenAddress);
        emit SetGovTokenForIssueEvent(msg.sender, _issueId, _govTokenAddress, _projectId);
    }

    function depositEthForIssue(string calldata _issueId) public payable {
        require(msg.value > 0, 'You must send ETH.');
        require(issueStatusByIssueId[_issueId] == IssueStatus.OPEN, 'Issue is not OPEN.');

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
        require(issueStatusByIssueId[issueDeposits[_depositId].issueId] == IssueStatus.OPEN, 'Issue is not OPEN.');

        uint256 payoutAmt = issueDeposits[_depositId].amount;
        issueDepositsAmountByIssueId[
            issueDeposits[_depositId].issueId
        ] -= payoutAmt;
        emit RefundIssueDepositEvent(msg.sender, payoutAmt, issueDeposits[_depositId].issueId, _depositId);
        delete issueDeposits[_depositId];
        payable(msg.sender).transfer(payoutAmt);
    }



    // ------------ ISSUE CLAIMING ------------ //

    event WithdrawIssueDepositEvent(string issueId, address recipient, uint256 amount);

    struct IssueWithdrawRequest {
        string issueId;
        address payoutAddress;
    }

    mapping(bytes32 => IssueWithdrawRequest) public issueWithdrawRequests;

    function withdrawIssueDeposit(
        address _oracle,
        string calldata _issueId
    ) public oracleHandlesJob(_oracle, 'claim') returns(bytes32 requestId) {
        require(issueStatusByIssueId[_issueId] == IssueStatus.OPEN, 'Issue is not OPEN.'); 

        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(_oracle, 'claim');
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.confirmWithdrawIssueDeposit.selector
            );
        request.add('githubUserId', userAddressStorage.userIdsByAddress(msg.sender));
        request.add('issueId', _issueId);
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);
        issueWithdrawRequests[requestId] = IssueWithdrawRequest({
            issueId: _issueId,
            payoutAddress: msg.sender
        });
    }

    function confirmWithdrawIssueDeposit(bytes32 _requestId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(issueWithdrawRequests[_requestId].payoutAddress != address(0) );
        address payoutAddr = issueWithdrawRequests[_requestId].payoutAddress;
        uint256 payoutAmt = issueDepositsAmountByIssueId[issueWithdrawRequests[_requestId].issueId];
        issueDepositsAmountByIssueId[issueWithdrawRequests[_requestId].issueId] = 0;
        issueStatusByIssueId[issueWithdrawRequests[_requestId].issueId] = IssueStatus.CLAIMED;
        awardGovernanceTokens(
            payoutAddr,
            payoutAmt,
            govTokenByIssueId[issueWithdrawRequests[_requestId].issueId]
        );
        emit WithdrawIssueDepositEvent(issueWithdrawRequests[_requestId].issueId, payoutAddr, payoutAmt);
        delete issueWithdrawRequests[_requestId];
        // delete issueDeposits[_depositId]; ??? loop through issueDepositIdsByIssueId ???
        payable(payoutAddr).transfer(payoutAmt);
    }



    // ------------ GOVERNANCE ------------ //

    event AwardGovernanceTokensEvent(address recipient, uint256 amount, address tokenAddr);

    OctobayGovernor public octobayGovernor;

    /// @notice Used to store Chainlink requests for new governance tokens
    struct NewGovernanceToken {
        bool isValue; // Ensure we have a valid value in the map
        string githubUserId; // Github graphql ID of the user we need to check for ownership
        string name; // Name of the new governance token
        string symbol; // Symbol to use for the new governance token
        string projectId; // Github graphql ID of the project (repo/org) to be associated with the new token
        uint16 newProposalShare; // Share of gov tokens a holder requires before they can create new proposals
        uint16 minQuorum; // The minimum quorum allowed for new proposals
        address creator; // Address of the creator, we need to store this as we lose it in the Oracle callback otherwise
    }

    mapping(bytes32 => NewGovernanceToken) public newGovernanceTokenReqs;

    /// @notice A request from the site to create a new governance token, checks ownership of the given
    ///         project (repo or org) via a Chainlink Oracle request to confirm
    /// @dev Using a struct as an argument here otherwise we get stack too deep errors
    /// @param _oracle Specify the address of the _oracle to use for the request
    /// @param _newToken The details of the new governance token to create
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
        request.add('repoOrgId', _newToken.projectId);
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        _newToken.creator = msg.sender;
        newGovernanceTokenReqs[requestId] = _newToken;
    }

    /// @notice Called in response by the Chainlink Oracle, continues with governance token creation
    /// @param _requestId Chainlink request ID being returned
    /// @param _result True if the given github user is an owner of the given project (org/repo)
    function confirmCreateGovernanceToken(bytes32 _requestId, bool _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(_result, "User is not owner of organization or repository");
        NewGovernanceToken memory newToken = newGovernanceTokenReqs[_requestId];
        require(newToken.isValue, "No such request");
        delete newGovernanceTokenReqs[_requestId];

        OctobayGovToken deployedToken = octobayGovernor.createGovernorAndToken(
            newToken.creator,
            newToken.projectId,
            newToken.newProposalShare,
            newToken.minQuorum,
            newToken.name,
            newToken.symbol
        );
        uint256 nftId = octobayGovNFT.mintTokenForProject(newToken.creator, newToken.projectId, address(deployedToken));
        octobayGovNFT.grantAllPermissions(nftId);
    }

    /// @notice Awards (mints) governance tokens to users for completing an issue (bounty) according to USD amount of bounty
    /// @param recipient Address of user to award governance tokens to
    /// @param payoutEth Amount in wei of the completed bounty, used to calculate USD amount of tokens to award
    /// @param tokenAddr Address of the governance token to award this user
    function awardGovernanceTokens(
        address recipient,
        uint256 payoutEth,
        OctobayGovToken tokenAddr
    ) internal {
        // Issues with the price feed so commenting it out and hardcoding for now
        // (
        //     , //uint80 roundID, 
        //     int price,
        //     , //uint startedAt,
        //     , //uint timeStamp,
        //     //uint80 answeredInRound
        // ) = ethUSDPriceFeed.latestRoundData();
        // uint256 amount = uint256((payoutEth * uint256(price)) / ethUSDPriceFeed.decimals());

        uint256 ethPriceUSD = 2000;
        uint256 amount = uint256((payoutEth * ethPriceUSD) / 10 ** 18);
        emit AwardGovernanceTokensEvent(recipient, amount, address(tokenAddr));
        tokenAddr.mint(recipient, amount);
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
