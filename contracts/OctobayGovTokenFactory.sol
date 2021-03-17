// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OctobayStorage.sol';
import './OctobayGovToken.sol';

contract OctobayGovTokenFactory is OctobayStorage {

    /// @param _name Name of the new token
    /// @param _symbol Token Symbol for the new token
    /// @return The address of the new token contract
    function createToken(string memory _name, string memory _symbol) external onlyOctobay returns (OctobayGovToken) {
        OctobayGovToken newToken = new OctobayGovToken(_name, _symbol);
        newToken.setOctobay(msg.sender);
        return newToken;
    }    
}