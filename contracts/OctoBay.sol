// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract OctoBay is ERC20, Ownable, ChainlinkClient {
  event UserDepositEvent(address account, uint256 amount, string githubUser);
  event UserSendEvent(address account, uint256 amount, string githubUser);
  event IssueDepositEvent(address account, uint256 amount, string issueId);
  event ReleaseIssueDepositsEvent(string issueId, string githubUser);

  struct User {
    string githubUser;
    address ethAddress;
    uint256 status; // 1 = requested, 2 = confirmed
  }
  mapping(bytes32 => User) public users;
  mapping(address => bytes32) public userIDsByAddress;
  mapping(string => bytes32) public userIDsByGithubUser;

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

  uint256 private registrationFee;
  uint256 private claimFee;

  constructor(address _link) ERC20("OctoPin", "OPIN") public {
    if (_link == address(0)) {
      setPublicChainlinkToken();
    } else {
      setChainlinkToken(_link);
    }

    registrationFee = 0.1 * 10 ** 18; // 0.1 LINK
    claimFee = 0.1 * 10 ** 18; // 0.1 LINK
  }

  function register(address _oracle, bytes32 _jobId, string memory _githubUser) public {
    Chainlink.Request memory request = buildChainlinkRequest(_jobId, address(this), this.confirmRegistration.selector);
    request.add("githubUser", _githubUser);
    request.add("ethAddress", addressToIntString(msg.sender));
    bytes32 requestId = sendChainlinkRequestTo(_oracle, request, registrationFee);

    users[requestId] = User(_githubUser, msg.sender, 1);
  }

  function confirmRegistration(bytes32 _requestId) public recordChainlinkFulfillment(_requestId) {
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

  function sendEthToGithubUser(string calldata _githubUser) external payable {
    require(msg.value > 0, "You must send ETH.");
    require(users[userIDsByGithubUser[_githubUser]].ethAddress != address(0), "This GitHub user is not registered.");
    require(users[userIDsByGithubUser[_githubUser]].status == 2, "This GitHub user is not confirmed yet.");
    payable(users[userIDsByGithubUser[_githubUser]].ethAddress).transfer(msg.value);
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
    require(users[userIDsByAddress[msg.sender]].ethAddress == msg.sender, "This Ethereum address is not registered with any GitHub user.");
    require(keccak256(bytes(userDeposits[_depositId].githubUser)) == keccak256(bytes(users[userIDsByAddress[msg.sender]].githubUser)), "Deposit is not for this GitHub account.");
    payable(msg.sender).transfer(userDeposits[_depositId].amount);
    delete userDeposits[_depositId];
  }

  function refundUserDeposit(uint256 _depositId) external {
    require(userDeposits[_depositId].from == msg.sender, "Deposit did not came from this Ethereum address.");
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
    issueDepositsAmountByIssueId[_issueId] += msg.value;
    emit IssueDepositEvent(msg.sender, msg.value, _issueId);
  }

  function refundIssueDeposit(uint256 _depositId) external {
    require(issueDeposits[_depositId].from == msg.sender, "Deposit did not come from this Ethereum address or does not exist.");
    require(issueDepositsAmountByIssueId[issueDeposits[_depositId].issueId] >= issueDeposits[_depositId].amount, "This issue deposit has been withdrawn already.");
    payable(msg.sender).transfer(issueDeposits[_depositId].amount);
    issueDepositsAmountByIssueId[issueDeposits[_depositId].issueId] -= issueDeposits[_depositId].amount;
    delete issueDeposits[_depositId];
  }

  function getIssueDepositIdsForIssueId(string calldata _depositId) external view returns(uint256[] memory) {
    return issueDepositIdsByIssueId[_depositId];
  }

  function getIssueDepositIdsForSender() external view returns(uint256[] memory) {
    return issueDepositIdsBySender[msg.sender];
  }

  function pinIssue(string memory _issueId, uint256 _amount) public {
    require(_amount > 0, "Amount must be greater zero.");
    _burn(msg.sender, _amount);
    issuePins[_issueId] += _amount;
  }

  function claimPullRequest(address _oracle, bytes32 _jobId, string memory _prId, string memory _githubUser) public {
    require(pullRequestClaims[pullRequestClaimIDsByPrId[_prId]].status != 2, "Pull request already claimed.");
    require(users[userIDsByGithubUser[_githubUser]].status != 2, "This GitHub user is not registered.");

    Chainlink.Request memory request = buildChainlinkRequest(_jobId, address(this), this.confirmPullRequestClaim.selector);
    request.add("githubUser", _githubUser);
    request.add("prId", _prId);
    bytes32 requestId = sendChainlinkRequestTo(_oracle, request, claimFee);

    pullRequestClaims[requestId] = PullRequestClaim(_githubUser, _prId, 1);
  }

  function confirmPullRequestClaim(bytes32 _requestId, uint256 _score) public recordChainlinkFulfillment(_requestId) {
    require(1 <= _score && _score <= 100, "Invalid score: 1 <= score <= 100");
    require(pullRequestClaims[_requestId].status == 1, "Pull request claim was not requested.");
    require(users[userIDsByGithubUser[pullRequestClaims[_requestId].githubUser]].ethAddress != address(0), "This GitHub user is not registered.");

    pullRequestClaims[_requestId].status = 2;
    _mint(users[userIDsByGithubUser[pullRequestClaims[_requestId].githubUser]].ethAddress, _score * uint256(10) ** decimals());
  }

  function releaseIssueDeposits(address _oracle, bytes32 _jobId, string memory _issueId, string memory _githubUser) public {
    require(issueDepositsAmountByIssueId[_issueId] > 0, "Issue has no deposits to release.");
    require(users[userIDsByAddress[msg.sender]].ethAddress == msg.sender, "Only registered GitHub users can release issue deposits.");

    Chainlink.Request memory request = buildChainlinkRequest(_jobId, address(this), this.confirmReleaseIssueDeposits.selector);
    request.add("githubUser", _githubUser);
    request.add("issueId", _issueId);
    bytes32 requestId = sendChainlinkRequestTo(_oracle, request, registrationFee);

    releasedIssues[requestId] = ReleasedIssue(_githubUser, _issueId, 1);
    issueReleaseIDsByIssueId[_issueId] = requestId;
  }

  function confirmReleaseIssueDeposits(bytes32 _requestId) public recordChainlinkFulfillment(_requestId) {
    require(releasedIssues[_requestId].status == 1, "Isse deposit release was not requested.");
    releasedIssues[_requestId].status = 2;
    emit ReleaseIssueDepositsEvent(releasedIssues[_requestId].issueId, releasedIssues[_requestId].githubUser);
  }

  function claimReleasedIssueDeposits(string calldata _issueId) external {
    require(users[userIDsByAddress[msg.sender]].ethAddress == msg.sender, "No GitHub account registered with this Ethereum account.");
    require(keccak256(bytes(releasedIssues[issueReleaseIDsByIssueId[_issueId]].githubUser)) == keccak256(bytes(users[userIDsByAddress[msg.sender]].githubUser)), "The GitHub account this issue was released to does not belong to this Ethereum account.");
    require(issueDepositsAmountByIssueId[_issueId] > 0, "Issue deposits already claimed.");

    payable(msg.sender).transfer(issueDepositsAmountByIssueId[_issueId]);
    issueDepositsAmountByIssueId[_issueId] = 0;
  }

  function addressToIntString(address _address) internal pure returns (string memory _string) {
    uint _i = uint256(_address);
    if (_i == 0) {
        return "0";
    }
    uint j = _i;
    uint len;
    while (j != 0) {
        len++;
        j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint k = len - 1;
    while (_i != 0) {
        bstr[k--] = byte(uint8(48 + _i % 10));
        _i /= 10;
    }
    return string(bstr);
  }
}
