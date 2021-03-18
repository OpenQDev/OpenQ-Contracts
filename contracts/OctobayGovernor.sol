// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayStorage.sol';

// TODO: Replace this with OctobayGovToken when it's merged
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// This contract acts as Octobay's storage of all Governors which are used for voting on proposals
contract OctobayGovernor is OctobayStorage {

    struct Governor {
        bool isValue; // Ensure we have a valid value in the map
        uint256 proposalCount; // Number of proposals
        uint16 newProposalReq; // min percentage required for a token holder to create a new proposal
        mapping (uint => Proposal) proposalList; // List of proposals
    }

    struct Proposal {
        bool isValue; // Ensure we have a valid value in the map
        string discussionId; // GitHub Graph ID
        uint256 startDate; // timestamp from when proposal is Active
        uint256 endDate; // timestamp for when voting closes on proposal, can be 0 (open ended)
        uint16 quorum; // min percentage (0 - 10000)
        int16 voteCount; // the current vote count as a percent of supply
        ERC20 votingToken; // governance token required to vote
        mapping (address => Vote) votesBySubmitter; // map of votes submitted for proposal by submitter
    }

    struct Vote {
        bool hasVoted; // to track whether a token holder has already voted
        int16 vote; // can be negative, represents token share (0 - 10000)
    }

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded
    }

    /// @notice Maps org/repo path to a Governor
    mapping (string => Governor) public governorsByProjectId;

    function createGovernor(string memory _projectId, uint16 _newProposalReq) external onlyOctobay {
        require(!governorsByProjectId[_projectId].isValue, "Governor for that _projectId already exists");
        Governor memory newGovernor = Governor({
            isValue: true,
            proposalCount: 0,
            newProposalReq: _newProposalReq
        });
        governorsByProjectId[_projectId] = newGovernor;
    }

    function createProposal(string memory _projectId, string memory _discussionId, uint256 _startDate, uint256 _endDate, uint16 _quorum, ERC20 _votingToken) external onlyOctobay {
        require(governorsByProjectId[_projectId].isValue, "Governor for that _projectId doesn't exist");
        Governor storage governor = governorsByProjectId[_projectId];

        Proposal memory newProposal = Proposal({
            isValue: true,
            discussionId: _discussionId,
            startDate: _startDate,
            endDate: _endDate,
            quorum: _quorum,
            voteCount: 0,
            votingToken: _votingToken
        });

        governor.proposalCount++;
        governor.proposalList[governor.proposalCount] = newProposal;

    }

    function proposalState(string memory _projectId, uint256 _proposalId) public view proposalExists(_projectId, _proposalId) returns(ProposalState) {
        Proposal storage proposal = governorsByProjectId[_projectId].proposalList[_proposalId];
        if (block.timestamp < proposal.startDate) {
            return ProposalState.Pending;
        } else if (block.timestamp >= proposal.startDate && block.timestamp < proposal.endDate) {
            return ProposalState.Active;
        } else if (proposal.voteCount >= int(proposal.quorum)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

    function castVote(string memory _projectId, uint256 _proposalId, int16 _vote) external proposalExists(_projectId, _proposalId) {
        Proposal storage proposal = governorsByProjectId[_projectId].proposalList[_proposalId];
        require(proposalState(_projectId, _proposalId) == ProposalState.Active, "Proposal is not Active");
        uint voteAmt = _vote < 0 ? uint(-1 * _vote) : uint(_vote);
        require(proposal.votingToken.balanceOf(msg.sender) > voteAmt, "Sender doesn't have enough governance tokens to make that vote");

        proposal.voteCount += _vote;
        Vote memory newVote = Vote({
            hasVoted: true,
            vote: _vote
        });
        proposal.votesBySubmitter[msg.sender] = newVote;

    }

    modifier proposalExists(string memory _projectId, uint256 _proposalId) {
        require(governorsByProjectId[_projectId].isValue, "Governor for that _projectId doesn't exist");
        require(governorsByProjectId[_projectId].proposalList[_proposalId].isValue, "Proposal for that _proposalId doesn't exist");
        _;
    }
}
