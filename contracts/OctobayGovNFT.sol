// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol';
import './OctobayStorage.sol';

contract OctobayGovNFT is OctobayStorage, ERC721Pausable {
    enum Permission {
        MINT,
        TRANSFER,
        SET_ISSUE_GOVTOKEN,
        CREATE_PROPOSAL
        // e.t.c.
    }

    event MintTokenForProjectEvent(address to, string projectId, uint256 tokenId);
    event BurnTokenEvent(uint256 tokenId);

    mapping (uint256 => mapping (uint => bool) ) public permissionsByTokenID;
    mapping (uint256 => string) public projectIdsByTokenID;

    constructor(string memory name, string memory symbol) public ERC721(name, symbol) {
        // Prevent transfers by default unless we allow it
        _pause();
    }

    function hasPermission(uint256 _tokenId, Permission _perm) public view returns(bool) {
        return permissionsByTokenID[_tokenId][uint(_perm)];
    }

    function grantAllPermissions(uint256 _tokenId) external onlyOctobay {
        // There's no nice way of looping through enums... :( It's probably better that we do this here though
        _grantPermission(_tokenId, Permission.MINT);
        _grantPermission(_tokenId, Permission.TRANSFER);
        _grantPermission(_tokenId, Permission.SET_ISSUE_GOVTOKEN);
        _grantPermission(_tokenId, Permission.CREATE_PROPOSAL);
    }

    function grantPermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        _grantPermission(_tokenId, _perm);
    }

    function _grantPermission(uint256 _tokenId, Permission _perm) internal {
        permissionsByTokenID[_tokenId][uint(_perm)] = true;
    }

    function revokePermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        permissionsByTokenID[_tokenId][uint(_perm)] = false;
    }

    function mintTokenForProject(address _to, string memory _projectId) external onlyOctobay returns(uint256) {
        return _mintTokenForProject(_to, _projectId);
    }

    function _mintTokenForProject(address _to, string memory _projectId) internal returns(uint256) {
        uint256 tokenId = totalSupply() + 1;
        _unpause();
        _safeMint(_to, tokenId);
        _pause();
        projectIdsByTokenID[tokenId] = _projectId;
        emit MintTokenForProjectEvent(_to, _projectId, tokenId);
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

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
        require(hasPermission(_tokenId, Permission.TRANSFER), "Not allowed to transfer this token");
        _unpause();
        super.safeTransferFrom(_from, _to, _tokenId);
        _pause();
    }

    function mintTokenWithPermissions(address _to, uint256 _tokenId, Permission[] memory _perms) public {
        require(hasPermission(_tokenId, Permission.MINT), "Not allowed to mint new tokens");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of _tokenId");

        uint256 newTokenId = _mintTokenForProject(_to, projectIdsByTokenID[_tokenId]);
        for (uint i=0; i < _perms.length; i++) {
            _grantPermission(newTokenId, _perms[i]);
        }
    }

    function burn(uint256 _tokenId) public {
        _burn(_tokenId);
        emit BurnTokenEvent(_tokenId);
    }
}