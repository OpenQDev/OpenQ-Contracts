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

  mapping(address => bool) private oracles;

  mapping(string => User) public users;
  mapping(address => string) public usersByAddress;

  mapping(uint256 => UserDeposit) public userDeposits;
  uint256 private nextUserDepositId = 0;
  mapping(string => uint256[]) public userDepositIdsByGithubUser;
  mapping(address => uint256[]) public userDepositIdsBySender;

  mapping(uint256 => IssueDeposit) public issueDeposits;
  uint256 public nextIssueDepositId = 0;
  mapping(string => uint256[]) public issueDepositIdsByIssueId;
  mapping(address => uint256[]) public issueDepositIdsBySender;

  mapping(string => string) public releasedIssues;
  mapping(string => string) public releasedIssueRequests;
  mapping(string => string) public releasedIssueRequestsOwnedBy;

  mapping(string => uint256) public issueBoosts;
  mapping(string => uint8) public claimedPullRequests;

  modifier onlyOracles {
    require(oracles[msg.sender], "Only oracles can confirm operations.");
    _;
  }

  constructor() ERC20("OctoPin", "OPIN") public {
    oracles[owner()] = true;
  }


  function enableOracle(address _oracle) external onlyOwner {
    oracles[_oracle] = true;
  }

  function disableOracle(address _oracle) external onlyOwner {
    require(oracles[_oracle], "Oracle does not exists.");
    require(_oracle != owner(), "Owner oracle can not be removed.");
    oracles[_oracle] = false;
  }

  function register(string calldata _githubUser) external payable {
    require(msg.value > 35000 * tx.gasprice, "Registration fee (oracle cost) not covered.");
    if (users[_githubUser].account != address(0)) {
      delete usersByAddress[users[_githubUser].account];
    }
    users[_githubUser] = User(msg.sender, false);
    usersByAddress[msg.sender] = _githubUser;

    payable(owner()).transfer(msg.value);

    emit RegistrationRequestEvent(msg.sender, _githubUser);
  }

  function registerConfirm(string calldata _githubUser, address account) external onlyOracles {
    require(
      users[_githubUser].account != address(0) && users[_githubUser].account == account,
      "This account confirmation was never requested."
    );
    users[_githubUser].confirmed = true;
    emit RegistrationConfirmedEvent(account, _githubUser);
  }

  function sendEthToGithubUser(string calldata _githubUser) external payable {
    require(msg.value > 0, "You must send ETH.");
    require(users[_githubUser].account != address(0), "This GitHub User is not registered.");
    require(users[_githubUser].confirmed == true, "This GitHub User is not confirmed yet.");
    payable(users[_githubUser].account).transfer(msg.value);
    emit UserSendEvent(msg.sender, msg.value, _githubUser);
  }

  function depositEthForGithubUser(string calldata _githubUser) external payable {
    require(msg.value > 0, "You must send ETH.");
    nextUserDepositId++;
    userDeposits[nextUserDepositId] = UserDeposit(msg.sender, msg.value, _githubUser);
    userDepositIdsByGithubUser[_githubUser].push(nextUserDepositId);
    userDepositIdsBySender[msg.sender].push(nextUserDepositId);
    emit UserDepositEvent(msg.sender, msg.value, _githubUser);
  }

  function withdrawUserDeposit(uint256 _depositId) external {
    require(users[usersByAddress[msg.sender]].account == msg.sender, "GitHub account not registered with this Ethereum account.");
    require(keccak256(bytes(userDeposits[_depositId].githubUser)) == keccak256(bytes(usersByAddress[msg.sender])), "Deposit is not for this GitHub account.");
    payable(msg.sender).transfer(userDeposits[_depositId].amount);
    delete userDeposits[_depositId];
  }

  function refundUserDeposit(uint256 _depositId) external {
    require(userDeposits[_depositId].from == msg.sender, "Deposit did not came from this Ethereum account.");
    payable(msg.sender).transfer(userDeposits[_depositId].amount);
    delete userDeposits[_depositId];
  }

  function getUserDepositIdsForGithubUser(string calldata _githubUser) external view returns(uint256[] memory) {
    return userDepositIdsByGithubUser[_githubUser];
  }

  function getUserDepositIdsForSender() external view returns(uint256[] memory) {
    return userDepositIdsBySender[msg.sender];
  }

  function depositEthForIssue(string calldata _issueId) external payable {
    require(msg.value > 0, "You must send ETH.");
    nextIssueDepositId++;
    issueDeposits[nextIssueDepositId] = IssueDeposit(msg.sender, msg.value, _issueId);
    issueDepositIdsByIssueId[_issueId].push(nextIssueDepositId);
    issueDepositIdsBySender[msg.sender].push(nextIssueDepositId);
    emit IssueDepositEvent(msg.sender, msg.value, _issueId);
  }

  function refundIssueDeposit(uint256 _depositId) external {
    require(issueDeposits[_depositId].from == msg.sender, "Deposit did not came from this Ethereum account.");
    payable(msg.sender).transfer(issueDeposits[_depositId].amount);
    delete issueDeposits[_depositId];
  }

  function getIssueDepositIdsForIssueId(string calldata _depositId) external view returns(uint256[] memory) {
    return issueDepositIdsByIssueId[_depositId];
  }

  function getIssueDepositIdsForSender() external view returns(uint256[] memory) {
    return issueDepositIdsBySender[msg.sender];
  }

  function pinIssue(string memory _depositId, uint256 _amount) public {
    require(_amount > 0, "Amount must be greater zero.");
    _burn(msg.sender, _amount);
    issueBoosts[_depositId] += _amount;
  }

  function claimPullRequest(string calldata _prId, string calldata _githubUser) external payable {
    require(msg.value > 53000 * tx.gasprice, "Claim fee (oracle cost) not covered.");
    require(claimedPullRequests[_prId] != 2, "Pull request already claimed.");
    require(users[_githubUser].account != address(0), "This GitHub User is not registered.");
    payable(owner()).transfer(msg.value);
    claimedPullRequests[_prId] = 1;
    emit ClaimPrRequestEvent(_prId, _githubUser);
  }

  function confirmClaimPullRequest(string calldata _prId, string calldata _githubUser, uint256 _score) external onlyOracles {
    require(1 <= _score && _score <= 100, "Invalid score: 1 <= score <= 100");
    require(claimedPullRequests[_prId] == 1, "Pull request already claimed.");
    require(users[_githubUser].account != address(0), "This GitHub User is not registered.");
    claimedPullRequests[_prId] = 2;
    _mint(users[_githubUser].account, _score * uint256(10) ** decimals());
    emit ClaimPrConfirmEvent(_prId, _githubUser, _score);
  }

  function releaseIssueDeposits(string calldata _issueId, string calldata _githubUser) external payable {
    require(msg.value > 35000 * tx.gasprice, "Release fee (oracle cost) not covered.");
    require(issueDepositIdsByIssueId[_issueId].length > 0, "Issue has no deposits to release.");
    require(users[usersByAddress[msg.sender]].account == msg.sender, "No GitHub account registered with this Ethereum account.");
    payable(owner()).transfer(msg.value);
    releasedIssueRequests[_issueId] = _githubUser;
    releasedIssueRequestsOwnedBy[_issueId] = usersByAddress[msg.sender];
    emit ReleaseIssueDepositsRequestEvent(_issueId, _githubUser, usersByAddress[msg.sender]);
  }

  function confirmReleaseIssueDeposits(string calldata _issueId, string calldata _githubUser) external onlyOracles {
    require(issueDepositIdsByIssueId[_issueId].length > 0, "Issue has no deposits to release.");
    require(keccak256(bytes(releasedIssueRequests[_issueId])) == keccak256(bytes(_githubUser)), "This issue release was not requested.");
    emit ReleaseIssueDepositsConfirmEvent(_issueId, _githubUser, releasedIssueRequestsOwnedBy[_issueId]);
    releasedIssues[_issueId] = _githubUser;
    delete releasedIssueRequests[_issueId];
    delete releasedIssueRequestsOwnedBy[_issueId];
  }

  function claimReleasedIssueDeposits(string calldata _issueId) external {
    require(users[usersByAddress[msg.sender]].account == msg.sender, "No GitHub account registered with this Ethereum account.");
    require(keccak256(bytes(releasedIssues[_issueId])) == keccak256(bytes(usersByAddress[msg.sender])), "The GitHub account this issue was released to does not belong to this Ethereum account.");

    for (uint256 i = 0; i < issueDepositIdsByIssueId[_issueId].length; i++) {
      if (issueDeposits[issueDepositIdsByIssueId[_issueId][i]].amount > 0) {
        payable(msg.sender).transfer(issueDeposits[issueDepositIdsByIssueId[_issueId][i]].amount);
      }
      delete issueDeposits[issueDepositIdsByIssueId[_issueId][i]];
    }
    delete releasedIssues[_issueId];
  }
}
