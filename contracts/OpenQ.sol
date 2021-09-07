// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import './UserAddressStorage.sol';
import './DepositStorage.sol';

contract OpenQ is Ownable {
    constructor(address _userAddressStorage, address _depositStorage) {
        _setUserAddressStorage(_userAddressStorage);
        _setDepositStorage(_depositStorage);
    }

    // ------------ AUXILIARY CONTRACT ADDRESSES ------------ //

    DepositStorage public depositStorage;
    UserAddressStorage public userAddressStorage;

    // ------------ ADDRESS UPDATE EVENTS ------------ //

    event SetDepositStorageEvent(address depositStorage);
    event SetUserAddressStorageEvent(address addressStorage);

    // ------------ ADDRESS SETTERS (EXTERNAL) ------------ //

    function setDepositStorage(address _depositStorage) external onlyOwner {
        _setDepositStorage(_depositStorage);
    }

    function setUserAddressStorage(address _userAddressStorage)
        external
        onlyOwner
    {
        _setUserAddressStorage(_userAddressStorage);
    }

    // ------------ ADDRESS SETTERS (INTERNAL) ------------ //

    function _setDepositStorage(address _depositStorage) internal {
        depositStorage = DepositStorage(_depositStorage);
        emit SetDepositStorageEvent(_depositStorage);
    }

    function _setUserAddressStorage(address _userAddressStorage) internal {
        userAddressStorage = UserAddressStorage(_userAddressStorage);
        emit SetUserAddressStorageEvent(_userAddressStorage);
    }

    // ------------ REGISTRATION ------------ //

    struct UserAddressRegistration {
        string githubUserId;
        address ethAddress;
    }

    mapping(bytes32 => UserAddressRegistration) public userAddressRegistrations;

    function registerUserAddress(
        string calldata _githubUserId,
        address _ethAddress
    ) public onlyOwner {
        userAddressStorage.upsertUserAddress(_githubUserId, _ethAddress);
    }

    // ------------ USER DEPOSITS ------------ //

    function depositEthForGithubUser(string calldata _githubUserId)
        external
        payable
    {
        depositStorage.depositEthForGithubUser{value: msg.value}(
            _githubUserId,
            msg.sender
        );
    }

    function withdrawUserDeposit(uint256 _depositId) external {
        depositStorage.withdrawUserDeposit(
            _depositId,
            msg.sender,
            userAddressStorage.userIdsByAddress(msg.sender)
        );
    }

    function refundUserDeposit(uint256 _depositId) external {
        depositStorage.refundUserDeposit(_depositId, msg.sender);
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
        string username;
    }

    mapping(bytes32 => IssueWithdrawRequest) public issueWithdrawRequests;

    function withdrawIssueDeposit(
        string calldata _issueId,
        string calldata _username
    ) public onlyOwner {
        require(
            depositStorage.issueStatusByIssueId(_issueId) ==
                DepositStorage.IssueStatus.OPEN,
            'OpenQ: Issue is not OPEN.'
        );

        address payoutAddress = userAddressStorage.addresses(_username);

        depositStorage.withdrawIssueDeposit(payoutAddress, _issueId);
    }

    function usernameIsRegistered(string calldata _userId)
        public
        view
        returns (bool isRegistered)
    {
        return userAddressStorage.addresses(_userId) != address(0);
    }
}
