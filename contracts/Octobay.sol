// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.6/ChainlinkClient.sol';
import '@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol';
import '@opengsn/gsn/contracts/BaseRelayRecipient.sol';
import '@api3/airnode-protocol/contracts/AirnodeClient.sol';
import './UserAddressStorage.sol';
import './OracleStorage.sol';
import './OctobayGovToken.sol';
import './OctobayGovernor.sol';
import './OctobayGovNFT.sol';
import './OpenQUtilities.sol';
import './DepositStorage.sol';

contract Octobay is
    Ownable,
    ChainlinkClient,
    BaseRelayRecipient,
    AirnodeClient
{
    constructor(
        address _link,
        address _forwarder,
        address _userAddressStorage,
        address _oracleStorage,
        address _depositStorage,
        address _octobayGovernor,
        address _octobayGovNFT,
        address _ethUSDPriceFeed,
        address _openQUtilities
    ) public {
        setChainlinkToken(_link);
        _setTrustedForwarder(_forwarder); // GSN trusted forwarder
        _setUserAddressStorage(_userAddressStorage);
        _setOracleStorage(_oracleStorage);
        _setDepositStorage(_depositStorage);
        _setOctobayGovernor(_octobayGovernor);
        _setOctobayGovNFT(_octobayGovNFT);
        _setEthUSDPriceFeed(_ethUSDPriceFeed);
        _setOpenQUtilities(_openQUtilities);
    }

    // ------------ Set contract addresses ------------ //

    event SetTrustedForwarderEvent(address forwarder);
    event SetUserAddressStorageEvent(address addressStorage);
    event SetOracleStorageEvent(address oracleStorage);
    event SetDepositStorageEvent(address depositStorage);
    event SetOctobayGovernorEvent(address octobayGovernor);
    event SetOctobayGovNFTEvent(address octobayGovNFT);
    event SetEthUSDPriceFeedEvent(address ethUsdPriceFeed);
    event SetOpenQUtilities(address openQUtilities);

    function setTrustedForwarder(address _forwarder) external onlyOwner {
        _setTrustedForwarder(_forwarder);
    }

    function setUserAddressStorage(address _userAddressStorage)
        external
        onlyOwner
    {
        _setUserAddressStorage(_userAddressStorage);
    }

    function setOracleStorage(address _oracleStorage) external onlyOwner {
        _setOracleStorage(_oracleStorage);
    }

    function setDepositStorage(address _depositStorage) external onlyOwner {
        _setDepositStorage(_depositStorage);
    }

    function setOctobayGovernor(address _octobayGovernor) external onlyOwner {
        _setOctobayGovernor(_octobayGovernor);
    }

    function setOctobayGovNFT(address _octobayGovNFT) external onlyOwner {
        _setOctobayGovNFT(_octobayGovNFT);
    }

    function setOpenQUtilities(address _openQUtilities) external onlyOwner {
        _setOpenQUtilities(_openQUtilities);
    }

    function setEthUSDPriceFeed(address _ethUSDPriceFeed) external onlyOwner {
        _setEthUSDPriceFeed(_ethUSDPriceFeed);
    }

    function _setTrustedForwarder(address _forwarder) internal {
        trustedForwarder = _forwarder;
        emit SetTrustedForwarderEvent(_forwarder);
    }

    function _setUserAddressStorage(address _userAddressStorage) internal {
        userAddressStorage = UserAddressStorage(_userAddressStorage);
        emit SetUserAddressStorageEvent(_userAddressStorage);
    }

    function _setOracleStorage(address _oracleStorage) internal {
        oracleStorage = OracleStorage(_oracleStorage);
        emit SetOracleStorageEvent(_oracleStorage);
    }

    function _setDepositStorage(address _depositStorage) internal {
        depositStorage = DepositStorage(_depositStorage);
        emit SetDepositStorageEvent(_depositStorage);
    }

    function _setOctobayGovernor(address _octobayGovernor) internal {
        octobayGovernor = OctobayGovernor(_octobayGovernor);
        emit SetOctobayGovernorEvent(_octobayGovernor);
    }

    function _setOctobayGovNFT(address _octobayGovNFT) internal {
        octobayGovNFT = OctobayGovNFT(_octobayGovNFT);
        emit SetOctobayGovNFTEvent(_octobayGovNFT);
    }

    OpenQUtilities public openQUtilities;

    function _setOpenQUtilities(address _openQUtilities) internal {
        openQUtilities = OpenQUtilities(_openQUtilities);
        emit SetOpenQUtilities(_openQUtilities);
    }

    function _setEthUSDPriceFeed(address _ethUSDPriceFeed) internal {
        ethUSDPriceFeed = AggregatorV3Interface(_ethUSDPriceFeed);
        emit SetEthUSDPriceFeedEvent(_ethUSDPriceFeed);
    }

    // ------------ Oracles ------------ //

    //TODO: These methods are all wrappers, can we call OracleStorage directly?

    OracleStorage public oracleStorage;

    modifier oracleHandlesJob(address _oracle, string memory _jobName) {
        require(
            oracleStorage.oracleExists(_oracle),
            'Octobay: Oracle does not exist.'
        );
        require(
            oracleStorage.oracleJobExists(_oracle, _jobName),
            'Octobay: Oracle job does not exist.'
        );
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

    function changeOracleName(address _oracle, string calldata _name)
        external
        onlyOwner
    {
        oracleStorage.changeOracleName(_oracle, _name);
    }

    function addOracleJob(
        address _oracle,
        string calldata _jobName,
        OracleStorage.Job memory _job
    ) external onlyOwner {
        oracleStorage.addOracleJob(_oracle, _jobName, _job);
    }

    function removeOracleJob(address _oracle, string calldata _jobName)
        external
        onlyOwner
    {
        oracleStorage.removeOracleJob(_oracle, _jobName);
    }

    // ------------ GSN ------------ //

    address octobayPaymaster;

    function setPaymaster(address _octobayPaymaster) external onlyOwner {
        octobayPaymaster = _octobayPaymaster;
    }

    function _msgSender()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (address payable)
    {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (bytes memory ret)
    {
        return BaseRelayRecipient._msgData();
    }

    string public override versionRecipient = '2.0.0'; // GSN version

    function deductGasFee(string calldata _githubUserId, uint256 _amount)
        external
    {
        // only paymaster, cause paymaster pays for gas fee on behalf of user
        require(msg.sender == octobayPaymaster);
        depositStorage.deductGasFee(_githubUserId, _amount);
    }

    // ------------ REGISTRATION ------------ //

    UserAddressStorage public userAddressStorage;

    struct UserAddressRegistration {
        string githubUserId;
        address ethAddress;
    }

    mapping(bytes32 => UserAddressRegistration) public userAddressRegistrations;

    function registerUserAddress(address _oracle, string calldata _githubUserId)
        public
        oracleHandlesJob(_oracle, 'register')
        returns (bytes32 requestId)
    {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(
            _oracle,
            'register'
        );
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.confirmRegisterUserAddress.selector
        );
        request.add('githubUserId', _githubUserId);
        request.add(
            'ethAddress',
            openQUtilities.addressToIntString(_msgSender())
        );
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        userAddressRegistrations[requestId] = UserAddressRegistration(
            _githubUserId,
            _msgSender()
        );
    }

    function confirmRegisterUserAddress(
        bytes32 _requestId,
        bytes32 _addressName
    ) public recordChainlinkFulfillment(_requestId) {
        userAddressStorage.addUserAddress(
            userAddressRegistrations[_requestId].githubUserId,
            _addressName,
            userAddressRegistrations[_requestId].ethAddress
        );

        delete userAddressRegistrations[_requestId];
    }

    // ------------ USER DEPOSITS ------------ //

    DepositStorage public depositStorage;

    function depositEthForGithubUser(string calldata _githubUserId)
        external
        payable
    {
        // Forwards eth payment to depositStorage to hold
        depositStorage.depositEthForGithubUser{value: msg.value}(
            _githubUserId,
            msg.sender
        );
    }

    function refundUserDeposit(uint256 _depositId) external {
        depositStorage.refundUserDeposit(_depositId, msg.sender);
    }

    function withdrawUserDeposit(uint256 _depositId) external {
        depositStorage.withdrawUserDeposit(
            _depositId,
            msg.sender,
            userAddressStorage.userIdsByAddress(msg.sender)
        );
    }

    // ------------ ISSUE DEPOSITS ------------ //

    OctobayGovNFT public octobayGovNFT;

    function depositAndSetGovTokenForIssue(
        string calldata _issueId,
        OctobayGovToken _govToken
    ) external payable {
        depositEthForIssue(_issueId);
        setGovTokenForIssue(_issueId, _govToken);
    }

    function setGovTokenForIssue(
        string calldata _issueId,
        OctobayGovToken _govToken
    ) public {
        // Ensure they're giving us a valid gov token
        require(
            bytes(octobayGovernor.projectsByToken(_govToken)).length != 0,
            'Octobay: Invalid _govToken'
        );
        require(
            octobayGovNFT.userHasPermissionForGovToken(
                msg.sender,
                _govToken,
                OctobayGovNFT.Permission.SET_ISSUE_GOVTOKEN
            ),
            "Octobay: You don't have permission to set governance tokens for issues"
        );
        depositStorage.setGovTokenForIssue(_issueId, _govToken);
    }

    function depositEthForIssue(string calldata _issueId) public payable {
        // Forwards eth payment to depositStorage to hold
        depositStorage.depositEthForIssue{value: msg.value}(
            _issueId,
            msg.sender
        );
    }

    function refundIssueDeposit(uint256 _depositId) external {
        depositStorage.refundIssueDeposit(_depositId, msg.sender);
    }

    // ------------ ISSUE CLAIMING ------------ //

    struct IssueWithdrawRequest {
        string issueId;
        address payoutAddress;
    }

    mapping(bytes32 => IssueWithdrawRequest) public issueWithdrawRequests;

    function withdrawIssueDeposit(address _oracle, string calldata _issueId)
        public
        oracleHandlesJob(_oracle, 'claim')
        returns (bytes32 requestId)
    {
        require(
            depositStorage.issueStatusByIssueId(_issueId) ==
                DepositStorage.IssueStatus.OPEN,
            'Octobay: Issue is not OPEN.'
        );

        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(
            _oracle,
            'claim'
        );
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.confirmWithdrawIssueDeposit.selector
        );
        request.add(
            'githubUserId',
            userAddressStorage.userIdsByAddress(msg.sender)
        );
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
        uint256 payoutAmt = depositStorage.confirmWithdrawIssueDeposit(
            issueWithdrawRequests[_requestId].payoutAddress,
            issueWithdrawRequests[_requestId].issueId
        );
        octobayGovernor.awardGovernanceTokens(
            issueWithdrawRequests[_requestId].payoutAddress,
            payoutAmt,
            depositStorage.govTokenByIssueId(
                issueWithdrawRequests[_requestId].issueId
            )
        );
        delete issueWithdrawRequests[_requestId];
    }

    // ------------ GOVERNANCE ------------ //

    OctobayGovernor public octobayGovernor;
    AggregatorV3Interface internal ethUSDPriceFeed;

    /// @notice Used to store Chainlink requests for new governance tokens
    struct TempGovernanceRequest {
        bool isValue; // Ensure we have a valid value in the map
        address creator; // Address of the creator, we need to store this as we lose it in the Oracle callback otherwise
        string projectId; // Github graphql ID of the project (repo/org) to be associated with the new token
        uint16 newProposalShare; // Share of gov tokens a holder requires before they can create new proposals
        uint16 minQuorum; // The minimum quorum allowed for new proposals
        OctobayGovToken govToken; // The new governance token which needs to be confirmed
    }

    mapping(bytes32 => TempGovernanceRequest) public tempGovernanceReqs;

    /// @notice Used to wrap arguments to createGovernanceToken
    struct NewGovernanceRequest {
        string name; // Name of the new governance token
        string symbol; // Symbol to use for the new governance token
        string projectId; // Github graphql ID of the project (repo/org) to be associated with the new token
        uint16 newProposalShare; // Share of gov tokens a holder requires before they can create new proposals
        uint16 minQuorum; // The minimum quorum allowed for new proposals
    }

    /// @notice A request from the site to create a new governance token, checks ownership of the given
    ///         project (repo or org) via a Chainlink Oracle request to confirm
    /// @dev Using a struct as an argument here otherwise we get stack too deep errors
    /// @param _oracle Specify the address of the _oracle to use for the request
    /// @param _newGovReq The details of the new governor and token to create
    function createGovernanceToken(
        address _oracle,
        NewGovernanceRequest memory _newGovReq
    )
        public
        oracleHandlesJob(_oracle, 'check-ownership')
        returns (bytes32 requestId)
    {
        (bytes32 jobId, uint256 jobFee) = oracleStorage.getOracleJob(
            _oracle,
            'check-ownership'
        );
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.confirmCreateGovernanceToken.selector
        );
        request.add(
            'githubUserId',
            userAddressStorage.userIdsByAddress(msg.sender)
        );
        request.add('repoOrgId', _newGovReq.projectId);
        requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        tempGovernanceReqs[requestId] = TempGovernanceRequest({
            isValue: true,
            creator: msg.sender,
            projectId: _newGovReq.projectId,
            newProposalShare: _newGovReq.newProposalShare,
            minQuorum: _newGovReq.minQuorum,
            govToken: octobayGovernor.createToken(
                _newGovReq.name,
                _newGovReq.symbol
            )
        });
    }

    /// @notice Called in response by the Chainlink Oracle, continues with governance token creation
    /// @param _requestId Chainlink request ID being returned
    /// @param _result True if the given github user is an owner of the given project (org/repo)
    function confirmCreateGovernanceToken(bytes32 _requestId, bool _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(
            tempGovernanceReqs[_requestId].isValue,
            'Octobay: No such request'
        );

        if (!_result) {
            delete tempGovernanceReqs[_requestId];
            return;
        }

        octobayGovernor.createGovernorAndSetToken(
            tempGovernanceReqs[_requestId].creator,
            tempGovernanceReqs[_requestId].projectId,
            tempGovernanceReqs[_requestId].newProposalShare,
            tempGovernanceReqs[_requestId].minQuorum,
            tempGovernanceReqs[_requestId].govToken
        );
        uint256 nftId = octobayGovNFT.mintNFTForGovToken(
            tempGovernanceReqs[_requestId].creator,
            tempGovernanceReqs[_requestId].govToken
        );
        octobayGovNFT.grantAllPermissions(nftId);

        delete tempGovernanceReqs[_requestId];
    }

    /// @notice A request from the site to update a governance token's params for new proposals
    /// @param _govToken The address of the governance token for this governor
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals
    function updateGovTokenParams(
        OctobayGovToken _govToken,
        uint16 _newProposalShare,
        uint16 _minQuorum
    ) public {
        octobayGovernor.updateGovTokenParams(
            _govToken,
            _newProposalShare,
            _minQuorum,
            msg.sender
        );
    }
}
