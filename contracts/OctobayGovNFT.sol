// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './OctobayStorage.sol';

contract OctobayGovNFT is OctobayStorage, ERC721 {
    enum Permission {
        TRANSFER,
        COPY,
        SET_ISSUE_GOVTOKEN,
        CREATE_PROPOSAL
        // e.t.c.
    }

    mapping (uint256 => mapping (uint => bool) ) public permissionsByTokenID;
    mapping (uint256 => string) public projectIdsByTokenID;

    constructor(string memory name, string memory symbol) public ERC721(name, symbol) {}

    function hasPermission(uint256 _tokenId, Permission _perm) public view returns(bool) {
        return permissionsByTokenID[_tokenId][uint(_perm)];
    }

    function grantPermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        permissionsByTokenID[_tokenId][uint(_perm)] = true;
    }

    function revokePermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        permissionsByTokenID[_tokenId][uint(_perm)] = false;
    }

    function mintTokenForProject(address _to, string memory _projectId) external onlyOctobay returns(uint256) {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId);
        projectIdsByTokenID[tokenId] = _projectId;
        return tokenId;
    }

    function getTokenIDForUserInProject(address _user, string memory _projectId) public view returns(uint256) {
        for (uint i=0; i < balanceOf(_user); i++) {
            if (keccak256(bytes(projectIdsByTokenID[tokenOfOwnerByIndex(_user, i)])) == keccak256(bytes(_projectId))) {
                return tokenOfOwnerByIndex(_user, i);
            }
        }

        return 0;
    }
}