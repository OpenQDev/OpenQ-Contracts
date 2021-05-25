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
        address creator; // msg.sender from Octobay->createGovernanceToken
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

    event VoteCastEvent(address tokenAddress, uint256 proposalId, string discussionId, int16 vote, address voter);

    event DepartmentCreatedEvent(address creator, string projectId, uint16 newProposalShare, uint16 minQuorum, string tokenName, string tokenSymbol, address tokenAddress);
    
    event UpdateGovTokenParamsEvent(address govToken, uint16 newProposalShare, uint16 minQuorum);

    /// @notice Maps gov token address to a Governor
    mapping (OctobayGovToken => Governor) public governorsByTokenAddr;

    OctobayGovNFT public octobayGovNFT;

    constructor(address _octobayGovNFT) public {
        octobayGovNFT = OctobayGovNFT(_octobayGovNFT);
    }

    /// @notice Essentially a wrapper for createGovernor and setTokenForProjectId to use only one call
    /// @param _projectId Github graphql ID of the org or repo this governor/token is associated with
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals
    /// @param _govToken Address of the gov token to use 
    function createGovernorAndSetToken(
        address _creator,
        string memory _projectId,
        uint16 _newProposalShare,
        uint16 _minQuorum,
        OctobayGovToken _govToken
    ) external onlyOctobay {
        setTokenForProjectId(_govToken, _projectId);
        createGovernor(_creator, _govToken, _newProposalShare, _minQuorum);

        emit DepartmentCreatedEvent(_creator, _projectId, _newProposalShare, _minQuorum, _govToken.name(), _govToken.symbol(), address(_govToken));
    } 

    /// @notice Necessary to set the parameters for new proposals and to know if we've already initialized a governor
    /// @param _creator The address of the creator of this gov token
    /// @param _newToken The address of the governance token for this governor
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals    
    function createGovernor(address _creator, OctobayGovToken _newToken, uint16 _newProposalShare, uint16 _minQuorum) public onlyOctobay {
        require(!governorsByTokenAddr[_newToken].isValue, "Governor for that token address already exists");
        Governor memory newGovernor = Governor({
            creator: _creator,
            isValue: true,
            proposalCount: 0,
            newProposalShare: _newProposalShare,
            minQuorum: _minQuorum
        });
        governorsByTokenAddr[_newToken] = newGovernor;
    }

    /// @param _govToken The address of the governance token for this governor
    /// @param _newProposalShare Share of gov tokens a holder requires before they can create new proposals
    /// @param _minQuorum The minimum quorum allowed for new proposals
    /// @param _msgSender The original sender
    function updateGovTokenParams(
        OctobayGovToken _govToken,
        uint16 _newProposalShare,
        uint16 _minQuorum,
        address _msgSender
    ) public onlyOctobay {
        require(governorsByTokenAddr[_govToken].isValue, "Governor does not exist");
        require(octobayGovNFT.userHasPermissionForGovToken(_msgSender, _govToken, OctobayGovNFT.Permission.MINT), "Not allowed to change token's parameters");

        governorsByTokenAddr[_govToken].newProposalShare = _newProposalShare;
        governorsByTokenAddr[_govToken].minQuorum = _minQuorum;

        emit UpdateGovTokenParamsEvent(address(_govToken), _newProposalShare, _minQuorum);
    }

    /// @notice Anyone with at least newProposalShare share of tokens or an NFT with the required permission can create a new proposal here
    /// @param _govToken Address of the gov token to use
    /// @param _discussionId The minimum quorum allowed for new proposals
    /// @param _startDate Date in epoch secs when this proposal will become active and voting is opened
    /// @param _endDate Date in epoch secs when the voting for this proposal closes
    /// @param _quorum The minimum percentage of gov tokens required for this proposal to pass          
    function createProposal(OctobayGovToken _govToken, string memory _discussionId, uint256 _startDate, uint256 _endDate, uint16 _quorum) external {
        require(governorsByTokenAddr[_govToken].isValue, "Governor for that _govToken doesn't exist");
        Governor storage governor = governorsByTokenAddr[_govToken];
        require(_quorum >= governor.minQuorum, "Given _quorum is less than this governor's minQuorum");

        require((_govToken.balanceOfAsPercent(msg.sender) >= governor.newProposalShare) || 
            (octobayGovNFT.userHasPermissionForGovToken(msg.sender, _govToken, OctobayGovNFT.Permission.CREATE_PROPOSAL)), 
            "Token share not high enough and no NFT permission for new proposals");
        
        uint256 snapshotId = _govToken.snapshot();
        Proposal memory newProposal = Proposal({
            isValue: true,
            creator: msg.sender,
            discussionId: _discussionId,
            startDate: _startDate,
            endDate: _endDate,
            quorum: _quorum,
            voteCount: 0,
            snapshotId: snapshotId,
            votingToken: _govToken 
        });

        governor.proposalCount++;
        governor.proposalList[governor.proposalCount] = newProposal;

        emit ProposalCreatedEvent(address(_govToken), _discussionId, _startDate, _endDate, _quorum, msg.sender, governor.proposalCount, snapshotId);
    }

    /// @param _govToken Address of the gov token to use 
    /// @param _proposalId ID of the proposal whose state we should check
    /// @return The ProposalState of the given proposal
    function proposalState(OctobayGovToken _govToken, uint256 _proposalId) public view proposalExists(_govToken, _proposalId) returns(ProposalState) {
        Proposal storage proposal = governorsByTokenAddr[_govToken].proposalList[_proposalId];
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
    /// @param _govToken Address of the gov token to use 
    /// @param _proposalId ID of the proposal to vote on
    /// @param _vote The positive(for) or negative(against) amount of your token share you'd like to vote towards this proposal 
    function castVote(OctobayGovToken _govToken, uint256 _proposalId, int16 _vote) external proposalExists(_govToken, _proposalId) {
        Proposal storage proposal = governorsByTokenAddr[_govToken].proposalList[_proposalId];
        require(proposalState(_govToken, _proposalId) == ProposalState.Active, "Proposal is not Active");
        require(!proposal.votesBySubmitter[msg.sender].hasVoted, "Sender has already voted");
        uint voteAmt = _vote < 0 ? uint(-1 * _vote) : uint(_vote);
        require(proposal.votingToken.balanceOfAsPercentAt(msg.sender, proposal.snapshotId) >= voteAmt, "Sender doesn't have enough governance tokens to make that vote");

        proposal.voteCount += _vote;
        Vote memory newVote = Vote({
            hasVoted: true,
            vote: _vote
        });
        proposal.votesBySubmitter[msg.sender] = newVote;

        emit VoteCastEvent(address(_govToken), _proposalId, proposal.discussionId, _vote, msg.sender);
    }

    //TODO: Include a castVoteBySignature to avoid gas costs for voters

    /// @param _govToken Address of the gov token to use 
    /// @param _proposalId ID of the proposal
    modifier proposalExists(OctobayGovToken _govToken, uint256 _proposalId) {
        require(governorsByTokenAddr[_govToken].isValue, "Governor for that _projectId doesn't exist");
        require(governorsByTokenAddr[_govToken].proposalList[_proposalId].isValue, "Proposal for that _proposalId doesn't exist");
        _;
    }

    // ------------ Token Factory ------------ //

    event AwardGovernanceTokensEvent(address recipient, uint256 amount, address tokenAddr);
    event UpdatedProjectId(string oldProjectId, string newProjectId, address tokenAddr);
    mapping (string => OctobayGovToken[]) public tokensByProjectId;
    mapping (OctobayGovToken => string) public projectsByToken;

    /// @param _name Name of the new token
    /// @param _symbol Token Symbol for the new token
    /// @return A reference to the created governance token
    function createToken(string memory _name, string memory _symbol) public onlyOctobay returns (OctobayGovToken) {
        OctobayGovToken newToken = new OctobayGovToken(_name, _symbol);
        newToken.setOctobay(msg.sender);
        return newToken;
    }

    /// @param _govToken Governance token to associate with the given project ID
    /// @param _projectId Github graphql ID of the org or repo this governor/token should be associated with
    function setTokenForProjectId(OctobayGovToken _govToken, string memory _projectId) public onlyOctobay {
        tokensByProjectId[_projectId].push(_govToken);
        projectsByToken[_govToken] = _projectId;
    }

    /// @notice Used in case a project wants to transfer tokens from a repo to an org in the future for example
    /// @param _govToken Address of the gov token to use 
    /// @param _newProjectId Github graphql ID of the new org or repo which should be used
    function updateProjectId(OctobayGovToken _govToken, string memory _newProjectId) external onlyOctobay {
        string memory oldProjectId = projectsByToken[_govToken];
        require(bytes(oldProjectId).length != 0, "Token _govToken is not a valid governance token");

        removeTokenFromProject(_govToken, oldProjectId);
        projectsByToken[_govToken] = _newProjectId;
        tokensByProjectId[_newProjectId].push(_govToken);
        emit UpdatedProjectId(oldProjectId, _newProjectId, address(_govToken));
    }

    // Ugh, dealing with array changes is ugly - we need to remove the token from the project's list and fill the empty array slot
    // But I think we do want a list of tokens for a projectId, right?
    function removeTokenFromProject(OctobayGovToken _govToken, string memory _oldProjectId) internal {
        uint len = tokensByProjectId[_oldProjectId].length;
        OctobayGovToken lastToken = tokensByProjectId[_oldProjectId][len-1];
        for (uint i=0; i < len; i++) {
            if (tokensByProjectId[_oldProjectId][i] == _govToken) {
                tokensByProjectId[_oldProjectId][i] = lastToken;
                delete tokensByProjectId[_oldProjectId][len-1];
                break;
            }
        }
    }

    /// @notice Awards (mints) governance tokens to users for completing an issue (bounty) according to USD amount of bounty
    /// @param recipient Address of user to award governance tokens to
    /// @param payoutEth Amount in wei of the completed bounty, used to calculate USD amount of tokens to award
    /// @param tokenAddr Address of the governance token to award this user
    function awardGovernanceTokens(
        address recipient,
        uint256 payoutEth,
        OctobayGovToken tokenAddr
    ) external onlyOctobay {
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
}
