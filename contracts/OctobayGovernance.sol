// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract OctobayGovernance {
    constructor() {}
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

}