// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OctoBay is ERC20, Ownable {
  struct User {
    address account;
    bool confirmed;
  }

  struct UserDeposit {
    address from;
    uint256 amount;
    string githubUser;
  }

  struct IssueDeposit {
    address from;
    uint256 amount;
    string issueId;
  }

  event RegistrationRequestEvent(address account, string githubUser);
  event RegistrationConfirmedEvent(address account, string githubUser);
  event ClaimPrRequestEvent(string prId, string githubUser);
  event ClaimPrConfirmEvent(string prId, string githubUser, uint256 score);
  event UserDepositEvent(address account, uint256 amount, string githubUser);
  event UserSendEvent(address account, uint256 amount, string githubUser);
  event IssueDepositEvent(address account, uint256 amount, string issueId);
  event ReleaseIssueDepositsRequestEvent(string issueId, string githubUser, string owner);
  event ReleaseIssueDepositsConfirmEvent(string issueId, string githubUser, string owner);

  mapping(address => bool) private _oracles;

  mapping(string => User) public _users;
  mapping(address => string) public _usersByAddress;

  mapping(uint256 => UserDeposit) public _userDeposits;
  uint256 private _nextUserDepositId = 0;
  mapping(string => uint256[]) public _userDepositIdsByGithubUser;
  mapping(address => uint256[]) public _userDepositIdsBySender;

  mapping(uint256 => IssueDeposit) public _issueDeposits;
  uint256 public _nextIssueDepositId = 0;
  mapping(string => uint256[]) public _issueDepositIdsByIssueId;
  mapping(address => uint256[]) public _issueDepositIdsBySender;

  mapping(string => string) public _releasedIssues;
  mapping(string => string) public _releasedIssueRequests;
  mapping(string => string) public _releasedIssueRequestsOwnedBy;

  mapping(string => uint256) public _issueBoosts;
  mapping(string => uint8) public _claimedPullRequests;

  modifier onlyOracles {
    require(_oracles[msg.sender], "Only oracles can confirm operations.");
    _;
  }

  constructor() ERC20("OctoPin", "OPIN") public {
    _oracles[owner()] = true;
  }

  /// @param oracle The oracle address to add
  function enableOracle(address oracle) external onlyOwner {
    _oracles[oracle] = true;
  }

  /// @param oracle The oracle address to remove (cannot be owner)
  function disableOracle(address oracle) external onlyOwner {
    require(_oracles[oracle], "Oracle does not exists.");
    require(oracle != owner(), "Owner oracle can not be removed.");
    _oracles[oracle] = false;
  }

  /// @dev Verify ownership over GitHub account by checking for a repositry of
  /// @dev githubUser named after msg.sender. Adds user as unconfirmed and sends
  /// @dev an oracle request, that will be fullfilled in registerConfirm.
  /// @param githubUser The GitHub username to register
  function register(string calldata githubUser) external payable {
    require(msg.value > 35000 * tx.gasprice, "Registration fee (oracle cost) not covered.");
    if (_users[githubUser].account != address(0)) {
      delete _usersByAddress[_users[githubUser].account];
    }
    _users[githubUser] = User(msg.sender, false);
    _usersByAddress[msg.sender] = githubUser;

    payable(owner()).transfer(msg.value);

    emit RegistrationRequestEvent(msg.sender, githubUser);
  }

  /// @dev Oracle fullfill method. Sets unconfirmed user to confirmed if repo exists.
  /// @param githubUser The githubUser to confirm
  /// @param account The Eth account to confirm
  function registerConfirm(string calldata githubUser, address account) external onlyOracles {
    require(
      _users[githubUser].account != address(0) && _users[githubUser].account == account,
      "This account confirmation was never requested."
    );
    _users[githubUser].confirmed = true;
    emit RegistrationConfirmedEvent(account, githubUser);
  }

  /// @dev Send ETH to a registered githubUser.
  /// @param githubUser The receiving githubUser.
  function sendEthToGithubUser(string calldata githubUser) external payable {
    require(msg.value > 0, "You must send ETH.");
    require(_users[githubUser].account != address(0), "This GitHub User is not registered.");
    require(_users[githubUser].confirmed == true, "This GitHub User is not confirmed yet.");
    payable(_users[githubUser].account).transfer(msg.value);
    emit UserSendEvent(msg.sender, msg.value, githubUser);
  }

  /// @dev Deposit ETH to a not-registered githubUser.
  /// @param githubUser The receiving githubUser.
  function depositEthForGithubUser(string calldata githubUser) external payable {
    require(msg.value > 0, "You must send ETH.");
    _nextUserDepositId++;
    _userDeposits[_nextUserDepositId] = UserDeposit(msg.sender, msg.value, githubUser);
    _userDepositIdsByGithubUser[githubUser].push(_nextUserDepositId);
    _userDepositIdsBySender[msg.sender].push(_nextUserDepositId);
    emit UserDepositEvent(msg.sender, msg.value, githubUser);
  }

  function withdrawUserDeposit(uint256 depositId) external {
    require(_users[_usersByAddress[msg.sender]].account == msg.sender, "GitHub account not registered with this Ethereum account.");
    require(keccak256(bytes(_userDeposits[depositId].githubUser)) == keccak256(bytes(_usersByAddress[msg.sender])), "Deposit is not for this GitHub account.");
    payable(msg.sender).transfer(_userDeposits[depositId].amount);
    delete _userDeposits[depositId];
  }

  function refundUserDeposit(uint256 depositId) external {
    require(_userDeposits[depositId].from == msg.sender, "Deposit did not came from this Ethereum account.");
    payable(msg.sender).transfer(_userDeposits[depositId].amount);
    delete _userDeposits[depositId];
  }

  function getUserDepositIdsForGithubUser(string calldata githubUser) external view returns(uint256[] memory) {
    return _userDepositIdsByGithubUser[githubUser];
  }

  function getUserDepositIdsForSender() external view returns(uint256[] memory) {
    return _userDepositIdsBySender[msg.sender];
  }

  /// @dev Deposit ETH to a github issue.
  /// @param issueId The receiving github issue.
  function depositEthForIssue(string calldata issueId) external payable {
    require(msg.value > 0, "You must send ETH.");
    _nextIssueDepositId++;
    _issueDeposits[_nextIssueDepositId] = IssueDeposit(msg.sender, msg.value, issueId);
    _issueDepositIdsByIssueId[issueId].push(_nextIssueDepositId);
    _issueDepositIdsBySender[msg.sender].push(_nextIssueDepositId);
    emit IssueDepositEvent(msg.sender, msg.value, issueId);
  }

  function refundIssueDeposit(uint256 depositId) external {
    require(_issueDeposits[depositId].from == msg.sender, "Deposit did not came from this Ethereum account.");
    payable(msg.sender).transfer(_issueDeposits[depositId].amount);
    delete _issueDeposits[depositId];
  }

  function getIssueDepositIdsForIssueId(string calldata issueId) external view returns(uint256[] memory) {
    return _issueDepositIdsByIssueId[issueId];
  }

  function getIssueDepositIdsForSender() external view returns(uint256[] memory) {
    return _issueDepositIdsBySender[msg.sender];
  }

  function pinIssue(string memory issueId, uint256 amount) public {
    require(amount > 0, "Amount must be greater zero.");
    _burn(msg.sender, amount);
    _issueBoosts[issueId] += amount;
  }

  function claimPullRequest(string calldata prId, string calldata githubUser) external payable {
    require(msg.value > 53000 * tx.gasprice, "Claim fee (oracle cost) not covered.");
    require(_claimedPullRequests[prId] != 2, "Pull request already claimed.");
    require(_users[githubUser].account != address(0), "This GitHub User is not registered.");
    payable(owner()).transfer(msg.value);
    _claimedPullRequests[prId] = 1;
    emit ClaimPrRequestEvent(prId, githubUser);
  }

  function confirmClaimPullRequest(string calldata prId, string calldata githubUser, uint256 score) external onlyOracles {
    require(1 <= score && score <= 100, "Invalid score: 1 <= score <= 100");
    require(_claimedPullRequests[prId] == 1, "Pull request already claimed.");
    require(_users[githubUser].account != address(0), "This GitHub User is not registered.");
    _claimedPullRequests[prId] = 2;
    _mint(_users[githubUser].account, score * uint256(10) ** decimals());
    emit ClaimPrConfirmEvent(prId, githubUser, score);
  }

  function releaseIssueDeposits(string calldata issueId, string calldata githubUser) external payable {
    require(msg.value > 35000 * tx.gasprice, "Release fee (oracle cost) not covered.");
    require(_issueDepositIdsByIssueId[issueId].length > 0, "Issue has no deposits to release.");
    require(_users[_usersByAddress[msg.sender]].account == msg.sender, "No GitHub account registered with this Ethereum account.");
    payable(owner()).transfer(msg.value);
    _releasedIssueRequests[issueId] = githubUser;
    _releasedIssueRequestsOwnedBy[issueId] = _usersByAddress[msg.sender];
    emit ReleaseIssueDepositsRequestEvent(issueId, githubUser, _usersByAddress[msg.sender]);
  }

  function confirmReleaseIssueDeposits(string calldata issueId, string calldata githubUser) external onlyOracles {
    require(_issueDepositIdsByIssueId[issueId].length > 0, "Issue has no deposits to release.");
    require(keccak256(bytes(_releasedIssueRequests[issueId])) == keccak256(bytes(githubUser)), "This issue release was not requested.");
    emit ReleaseIssueDepositsConfirmEvent(issueId, githubUser, _releasedIssueRequestsOwnedBy[issueId]);
    _releasedIssues[issueId] = githubUser;
    delete _releasedIssueRequests[issueId];
    delete _releasedIssueRequestsOwnedBy[issueId];
  }

  function claimReleasedIssueDeposits(string calldata issueId) external {
    require(_users[_usersByAddress[msg.sender]].account == msg.sender, "No GitHub account registered with this Ethereum account.");
    require(keccak256(bytes(_releasedIssues[issueId])) == keccak256(bytes(_usersByAddress[msg.sender])), "The GitHub account this issue was released to does not belong to this Ethereum account.");

    for (uint256 i = 0; i < _issueDepositIdsByIssueId[issueId].length; i++) {
      if (_issueDeposits[_issueDepositIdsByIssueId[issueId][i]].amount > 0) {
        payable(msg.sender).transfer(_issueDeposits[_issueDepositIdsByIssueId[issueId][i]].amount);
      }
      delete _issueDeposits[_issueDepositIdsByIssueId[issueId][i]];
    }
    delete _releasedIssues[issueId];
  }
}
