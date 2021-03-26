// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayStorage.sol';
import './OctobayGovToken.sol';

contract OctobayGovTokenFactory is OctobayStorage {

    event NewTokenEvent(string name, string symbol, address tokenAddr);
    event UpdatedProjectId(string oldProjectId, string newProjectId, address tokenAddr);
    mapping (string => OctobayGovToken) public tokensByProjectId;

    /// @param _name Name of the new token
    /// @param _symbol Token Symbol for the new token
    /// @param _projectId Path of the org or repo which maps to the new token
    /// @return The address of the new token contract
    function createToken(string memory _name, string memory _symbol, string memory _projectId) external onlyOctobay returns (OctobayGovToken) {
        OctobayGovToken newToken = new OctobayGovToken(_name, _symbol);
        newToken.setOctobay(msg.sender);
        tokensByProjectId[_projectId] = newToken;
        emit NewTokenEvent(_name, _symbol, address(newToken));
        return newToken;
    }

    /// @notice Used in case a project wants to transfer tokens from a repo to an org in the future for example
    /// @param _oldProjectId Path of the old org or repo which should be updated
    /// @param _newProjectId Path of the new org or repo which should be used
    function updateProjectId(string memory _oldProjectId, string memory _newProjectId) external onlyOctobay {
        OctobayGovToken token = tokensByProjectId[_oldProjectId];
        require(address(token) != address(0), "Existing repo or org does not exist");
        delete tokensByProjectId[_oldProjectId];
        tokensByProjectId[_newProjectId] = token;
        emit UpdatedProjectId(_oldProjectId, _newProjectId, address(token));
    }    
}
