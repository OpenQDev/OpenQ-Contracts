// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayStorage.sol';
import './OctobayGovToken.sol';
import './OctobayGovNFT.sol';

/// @notice This contract acts as Octobay's storage of all Governors, proposals and associated tokens.
///         It handles all of the voting on the proposals and checking on statuses of proposals.
contract OctobayGovernor is OctobayStorage {

    struct Governor {
        bool isValue; // Ensure we have a valid value in the map
        uint256 proposalCount; // Number of proposals
        uint16 newProposalShare; // min percentage required for a token holder to create a new proposal
        uint16 minQuorum; // min quorum for all new proposals made in this governance department
        mapping (uint => Proposal) proposalList; // List of proposals
    }

    struct Proposal {
        bool isValue; // Ensure we have a valid value in the map
        address creator; // Creator of this proposal
        string discussionId; // GitHub Graph ID
        uint256 startDate; // timestamp from when proposal is Active
        uint256 endDate; // timestamp for when voting closes on proposal, can be 0 (open ended)
        uint16 quorum; // min percentage (0 - 10000)
        int16 voteCount; // the current vote count as a percent of supply
        uint256 snapshotId; // ID of the snapshot of balances for the token, taken at proposal creation
        OctobayGovToken votingToken; // governance token required to vote
        mapping (address => Vote) votesBySubmitter; // map of votes submitted for proposal by submitter
    }

    struct Vote {
        bool hasVoted; // to track whether a token holder has already voted
        int16 vote; // can be negative, represents token share (0 - 10000)
    }

    enum ProposalState {
        Pending, // Proposal is created but isn't yet active
        Active, // Proposal is active and can be voted on
        Defeated, // Proposal did not pass due to not reaching quorum before expiring
        Succeeded // Proposal passed by meeting quorum at expiry
    }

    event ProposalCreatedEvent(address tokenAddress, string discussionId, uint256 startDate, uint256 endDate, uint16 quorum, address creator, uint256 proposalId, uint256 snapshotId);

    event VoteCastEvent(string projectId, uint256 proposalId, string discussionId, int16 vote, address voter);

    event DepartmentCreatedEvent(string projectId, uint16 newProposalShare, uint16 minQuorum, string tokenName, string tokenSymbol, address tokenAddress);

    /// @notice Maps org/repo path to a Governor
    mapping (string => Governor) public governorsByProjectId;

    OctobayGovNFT public octobayGovNFT;

    constructor(address _octobayGovNFT) public {
        octobayGovNFT = OctobayGovNFT(_octobayGovNFT);
    }

    /// @notice Essentially a wrapper for createGovernor and createToken to use only one call
    /// @param _projectId Github graphql ID of the org or repo this governor/token is associated with
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals
    /// @param _name Name of the new governance token
    /// @param _symbol Symbol to use for the new governance token
    /// @return newToken A reference to the created governance token
    function createGovernorAndToken(
        string memory _projectId,
        uint16 _newProposalShare,
        uint16 _minQuorum,
        string memory _name,
        string memory _symbol
    ) external onlyOctobay returns(OctobayGovToken newToken) {
        createGovernor(_projectId, _newProposalShare, _minQuorum);
        newToken = createToken(_name, _symbol, _projectId);

        emit DepartmentCreatedEvent(_projectId, _newProposalShare, _minQuorum, _name, _symbol, address(newToken));
    } 

    /// @notice Necessary to set the parameters for new proposals and to know if we've already initialized a governor
    /// @param _projectId Github graphql ID of the org or repo this governor/token is associated with
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals    
    function createGovernor(string memory _projectId, uint16 _newProposalShare, uint16 _minQuorum) public onlyOctobay {
        require(!governorsByProjectId[_projectId].isValue, "Governor for that _projectId already exists");
        Governor memory newGovernor = Governor({
            isValue: true,
            proposalCount: 0,
            newProposalShare: _newProposalShare,
            minQuorum: _minQuorum
        });
        governorsByProjectId[_projectId] = newGovernor;
    }

    /// @notice Anyone with at least newProposalShare share of tokens or an NFT with the required permission can create a new proposal here
    /// @param _tokenAddress Address of the gov token to use. Required as the same project can have multiple departments
    /// @param _projectId Github graphql ID of the org or repo this proposal is associated with
    /// @param _discussionId The minimum quorum allowed for new proposals
    /// @param _startDate Date in epoch secs when this proposal will become active and voting is opened
    /// @param _endDate Date in epoch secs when the voting for this proposal closes
    /// @param _quorum The minimum percentage of gov tokens required for this proposal to pass          
    function createProposal(address _tokenAddress, string memory _projectId, string memory _discussionId, uint256 _startDate, uint256 _endDate, uint16 _quorum) external {
        require(governorsByProjectId[_projectId].isValue, "Governor for that _projectId doesn't exist");
        Governor storage governor = governorsByProjectId[_projectId];
        OctobayGovToken govToken = tokensByProjectId[_projectId];
        require(address(govToken) != address(0), "No governance token for that _projectId");
        require(_quorum >= governor.minQuorum, "Given _quorum is less than this governor's minQuorum");

        bool hasPermission = false;
        if (govToken.balanceOfAsPercent(msg.sender) >= governor.newProposalShare) {
            hasPermission = true;
        } else {
            uint256 govNFTId = octobayGovNFT.getTokenIDForUserInProject(msg.sender, _projectId);
            if (govNFTId != 0 && octobayGovNFT.hasPermission(govNFTId, OctobayGovNFT.Permission.CREATE_PROPOSAL)) {
                hasPermission = true;
            }
        }
        require(hasPermission, "Token share not high enough and no NFT permission for new proposals");
        
        uint256 snapshotId = govToken.snapshot();
        Proposal memory newProposal = Proposal({
            isValue: true,
            creator: msg.sender,
            discussionId: _discussionId,
            startDate: _startDate,
            endDate: _endDate,
            quorum: _quorum,
            voteCount: 0,
            snapshotId: snapshotId,
            votingToken: govToken 
        });

        governor.proposalCount++;
        governor.proposalList[governor.proposalCount] = newProposal;

        emit ProposalCreatedEvent(_tokenAddress, _discussionId, _startDate, _endDate, _quorum, msg.sender, governor.proposalCount, snapshotId);
    }

    /// @notice Anyone with at least newProposalShare share of tokens or an NFT with the required permission can create a new proposal here
    /// @param _projectId Github graphql ID of the org or repo this proposal is associated with
    /// @param _proposalId ID of the proposal whose state we should check
    /// @return The ProposalState of the given proposal
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

    /// @dev Anyone with > 0 amount of tokens can vote. They can vote up to and including their share (but not necessarily all).
    ///      A positive _vote is considered in favour of the proposal and a negative is considered against it.
    /// @param _projectId Github graphql ID of the org or repo this proposal is associated with
    /// @param _proposalId ID of the proposal to vote on
    /// @param _vote The positive(for) or negative(against) amount of your token share you'd like to vote towards this proposal 
    function castVote(string memory _projectId, uint256 _proposalId, int16 _vote) external proposalExists(_projectId, _proposalId) {
        Proposal storage proposal = governorsByProjectId[_projectId].proposalList[_proposalId];
        require(proposalState(_projectId, _proposalId) == ProposalState.Active, "Proposal is not Active");
        require(!proposal.votesBySubmitter[msg.sender].hasVoted, "Sender has already voted");
        uint voteAmt = _vote < 0 ? uint(-1 * _vote) : uint(_vote);
        require(proposal.votingToken.balanceOfAsPercentAt(msg.sender, proposal.snapshotId) >= voteAmt, "Sender doesn't have enough governance tokens to make that vote");

        proposal.voteCount += _vote;
        Vote memory newVote = Vote({
            hasVoted: true,
            vote: _vote
        });
        proposal.votesBySubmitter[msg.sender] = newVote;

        emit VoteCastEvent(_projectId, _proposalId, proposal.discussionId, _vote, msg.sender);
    }

    //TODO: Include a castVoteBySignature to avoid gas costs for voters

    /// @param _projectId Github graphql ID of the org or repo this proposal is associated with
    /// @param _proposalId ID of the proposal
    modifier proposalExists(string memory _projectId, uint256 _proposalId) {
        require(governorsByProjectId[_projectId].isValue, "Governor for that _projectId doesn't exist");
        require(governorsByProjectId[_projectId].proposalList[_proposalId].isValue, "Proposal for that _proposalId doesn't exist");
        _;
    }

    // ------------ Token Factory ------------ //

    event UpdatedProjectId(string oldProjectId, string newProjectId, address tokenAddr);
    mapping (string => OctobayGovToken) public tokensByProjectId;

    /// @param _name Name of the new token
    /// @param _symbol Token Symbol for the new token
    /// @param _projectId Github graphql ID of the org or repo this governor/token is associated with
    /// @return A reference to the created governance token
    function createToken(string memory _name, string memory _symbol, string memory _projectId) public onlyOctobay returns (OctobayGovToken) {
        OctobayGovToken newToken = new OctobayGovToken(_name, _symbol);
        newToken.setOctobay(msg.sender);
        tokensByProjectId[_projectId] = newToken;
        return newToken;
    }

    /// @notice Used in case a project wants to transfer tokens from a repo to an org in the future for example
    /// @param _oldProjectId Github graphql ID of the old org or repo which should be updated
    /// @param _newProjectId Github graphql ID of the new org or repo which should be used
    function updateProjectId(string memory _oldProjectId, string memory _newProjectId) external onlyOctobay {
        OctobayGovToken token = tokensByProjectId[_oldProjectId];
        require(address(token) != address(0), "There is no token associated with _oldProjectId");
        delete tokensByProjectId[_oldProjectId];
        tokensByProjectId[_newProjectId] = token;
        emit UpdatedProjectId(_oldProjectId, _newProjectId, address(token));
    }     
}
