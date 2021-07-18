// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@api3/airnode-protocol/contracts/AirnodeClient.sol';
import './UserAddressStorage.sol';
import './OracleStorage.sol';
import './OpenQUtilities.sol';
import './DepositStorage.sol';

contract OpenQ is
    Ownable,
    AirnodeClient
{
    constructor(
        address _link,
        address _userAddressStorage,
        address _oracleStorage,
        address _depositStorage,
        address _openQUtilities,
        address _airnodeAddress
    ) public AirnodeClient(_airnodeAddress) {
        _setUserAddressStorage(_userAddressStorage);
        _setOracleStorage(_oracleStorage);
        _setDepositStorage(_depositStorage);
        _setOpenQUtilities(_openQUtilities);
    }

    // ------------ Airnode ------------ //

    mapping(bytes32 => bool) public incomingFulfillments;
    mapping(bytes32 => int256) public fulfilledData;
    bytes32 private _providerId;
    uint256 private _requesterIndex;
    bytes32 private _checkForIssueClosedByRequesterEndpointId;
    address private _designatedWallet;

    function checkForIssueClosedByRequester(bytes calldata parameters) {
        bytes32 requestId = airnode.makeFullRequest(
            _providerId,
            _checkForIssueClosedByRequesterEndpointId,
            _requesterIndex,
            _designatedWallet,
            address(this),
            this.confirmWithdrawIssueDeposit.selector,
            parameters
        );
        incomingFulfillments[requestId] = true;
    }

    function fulfill(
        bytes32 requestId,
        uint256 statusCode,
        bytes32 data
    ) external onlyAirnode() {
        require(incomingFulfillments[requestId], 'No such request made');
        delete incomingFulfillments[requestId];
        if (statusCode == 0) {
            fulfilledData[requestId] = data;
        }
    }

    // ------------ Set contract addresses ------------ //

    event SetUserAddressStorageEvent(address addressStorage);
    event SetOracleStorageEvent(address oracleStorage);
    event SetDepositStorageEvent(address depositStorage);
    event SetOpenQUtilities(address openQUtilities);

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

    function setOpenQUtilities(address _openQUtilities) external onlyOwner {
        _setOpenQUtilities(_openQUtilities);
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

    OpenQUtilities public openQUtilities;

    function _setOpenQUtilities(address _openQUtilities) internal {
        openQUtilities = OpenQUtilities(_openQUtilities);
        emit SetOpenQUtilities(_openQUtilities);
    }

    // ------------ Oracles ------------ //

    OracleStorage public oracleStorage;

    modifier oracleHandlesJob(address _oracle, string memory _jobName) {
        require(
            oracleStorage.oracleExists(_oracle),
            'OpenQ: Oracle does not exist.'
        );
        require(
            oracleStorage.oracleJobExists(_oracle, _jobName),
            'OpenQ: Oracle job does not exist.'
        );
        _;
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
        // Convert to Airnode request

        // Chainlink.Request memory request = buildChainlinkRequest(
        //     jobId,
        //     address(this),
        //     this.confirmRegisterUserAddress.selector
        // );
        // request.add('githubUserId', _githubUserId);
        // request.add(
        //     'ethAddress',
        //     openQUtilities.addressToIntString(_msgSender())
        // );
        // requestId = sendChainlinkRequestTo(_oracle, request, jobFee);

        userAddressRegistrations[requestId] = UserAddressRegistration(
            _githubUserId,
            _msgSender()
        );
    }

    function confirmRegisterUserAddress(
        bytes32 _requestId,
        bytes32 _addressName
    ) public onlyAirnode() {
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

    function depositEthForIssue(string calldata _issueId) public payable {
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

        // ---- Make Airnode request --- //
        // 'issueId', _issueId
        // 'githubUserId', userAddressStorage.userIdsByAddress(msg.sender)
        /* requestId = checkForIssueClosedByRequester(parameters)
         */

        issueWithdrawRequests[requestId] = IssueWithdrawRequest({
            issueId: _issueId,
            payoutAddress: msg.sender
        });
    }

    function confirmWithdrawIssueDeposit(
        bytes32 requestId,
        uint256 statusCode,
        bytes32 data
    ) external onlyAirnode() {
        // check data for CLOSED and PR author == requester
        uint256 payoutAmt = depositStorage.confirmWithdrawIssueDeposit(
            issueWithdrawRequests[_requestId].payoutAddress,
            issueWithdrawRequests[_requestId].issueId
        );
        delete issueWithdrawRequests[_requestId];
    }