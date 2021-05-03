// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol';
import './OctobayStorage.sol';
import './OctobayGovToken.sol';

/// @notice OctobayGovNFT tracks all NFTs minted for project owners which allows them to manage governors and create proposals.
///         They can also mint new NFTs to others and set the permissions on the NFT.
contract OctobayGovNFT is OctobayStorage, ERC721Pausable {
    enum Permission {
        MINT, // Can mint new NFTs for the associated project
        TRANSFER, // Can transfer this NFT to another address
        SET_ISSUE_GOVTOKEN, // Can set the governance token associated with an issue (bounty)
        CREATE_PROPOSAL // Can create new proposals for this project
        // e.t.c.
    }

    event MintNFTForGovTokenEvent(address to, uint256 tokenId, address govTokenAddress);
    event BurnTokenEvent(uint256 tokenId);

    mapping (uint256 => mapping (uint => bool) ) public permissionsByTokenId;
    mapping (uint256 => OctobayGovToken) public govTokensByTokenId;
    //Do we need a list of NFTs per gov token?

    constructor(string memory name, string memory symbol) public ERC721(name, symbol) {
        // Prevent transfers by default unless we allow it
        _pause();
    }

    /// @param _tokenId ID of the NFT to check
    /// @param _perm Permission to check
    /// @return Whether the NFT has that permission
    function hasPermission(uint256 _tokenId, Permission _perm) public view returns(bool) {
        return permissionsByTokenId[_tokenId][uint(_perm)];
    }

    /// @notice Grants all permissions to the given NFT
    /// @param _tokenId ID of the NFT to grant permissions to
    function grantAllPermissions(uint256 _tokenId) external onlyOctobay {
        // There's no nice way of looping through enums... :( It's probably better that we do this here though
        _grantPermission(_tokenId, Permission.MINT);
        _grantPermission(_tokenId, Permission.TRANSFER);
        _grantPermission(_tokenId, Permission.SET_ISSUE_GOVTOKEN);
        _grantPermission(_tokenId, Permission.CREATE_PROPOSAL);
    }

    /// @notice Revokes all permissions from the given NFT
    /// @param _tokenId ID of the NFT to grant permissions to
    function revokeAllPermissions(uint256 _tokenId) internal {
        // There's no nice way of looping through enums... :( It's probably better that we do this here though
        _revokePermission(_tokenId, Permission.MINT);
        _revokePermission(_tokenId, Permission.TRANSFER);
        _revokePermission(_tokenId, Permission.SET_ISSUE_GOVTOKEN);
        _revokePermission(_tokenId, Permission.CREATE_PROPOSAL);
    }    

    /// @param _tokenId ID of the NFT to grant permission to
    /// @param _perm Permission to enable
    function grantPermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        _grantPermission(_tokenId, _perm);
    }

    /// @param _tokenId ID of the NFT to grant permission to
    /// @param _perm Permission to enable
    function _grantPermission(uint256 _tokenId, Permission _perm) internal {
        permissionsByTokenId[_tokenId][uint(_perm)] = true;
    }

    /// @param _tokenId ID of the NFT to revoke permission from
    /// @param _perm Permission to revoke
    function revokePermission(uint256 _tokenId, Permission _perm) external onlyOctobay {
        _revokePermission(_tokenId, _perm);
    }

    /// @param _tokenId ID of the NFT to revoke permission from
    /// @param _perm Permission to revoke
    function _revokePermission(uint256 _tokenId, Permission _perm) internal  {
        permissionsByTokenId[_tokenId][uint(_perm)] = false;
    }

    /// @param _to The address to assign the newly minted NFT to
    /// @param _govToken The governance token associated with this NFT
    /// @return The token ID of the newly minted NFT
    function mintNFTForGovToken(address _to, OctobayGovToken _govToken) external onlyOctobay returns(uint256) {
        return _mintNFTForGovToken(_to, _govToken);
    }

    /// @param _to The address to assign the newly minted NFT to
    /// @param _govToken The governance token associated with this NFT
    /// @return The token ID of the newly minted NFT
    function _mintNFTForGovToken(address _to, OctobayGovToken _govToken) internal returns(uint256) {
        uint256 tokenId = totalSupply() + 1;
        _unpause();
        _safeMint(_to, tokenId);
        _pause();
        govTokensByTokenId[tokenId] = _govToken;
        emit MintNFTForGovTokenEvent(_to, tokenId, address(_govToken));
        return tokenId;
    }

    /// @notice Checks whether a user has a given permission for a given governance token
    /// @param _user Address of user to check for NFT ownership
    /// @param _govToken The governance token associated with this NFT
    /// @param _perm The permission we're checking for
    /// @return Whether the user 
    function userHasPermissionForGovToken(address _user, OctobayGovToken _govToken, Permission _perm) public view returns(bool) {
        for (uint i=0; i < balanceOf(_user); i++) {
            if (govTokensByTokenId[tokenOfOwnerByIndex(_user, i)] == _govToken) {
                return hasPermission(tokenOfOwnerByIndex(_user, i), _perm);
            }
        }

        return false;
    }

    /// @dev We need to override this as we don't allow transfers by default, we need to check the NFT has permission to transfer
    /// @param _from Address of NFT owner
    /// @param _to Address NFT is being transferred to
    /// @param _tokenId ID of the NFT
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
        require(hasPermission(_tokenId, Permission.TRANSFER), "Not allowed to transfer this token");
        _unpause();
        super.safeTransferFrom(_from, _to, _tokenId);
        _pause();
    }

    /// @notice If an NFT has the MINT permission, the owner can mint a new NFT to someone else based on theirs
    /// @param _to The address to assign the newly minted NFT to
    /// @param _tokenId ID of the NFT to be used as a reference for the new NFT
    /// @param _perms The array of permissions to assign to the new NFT
    /// @param _govToken The governance token associated with this NFT
    function mintTokenWithPermissions(address _to, uint256 _tokenId, Permission[] memory _perms, OctobayGovToken _govToken) public {
        require(hasPermission(_tokenId, Permission.MINT), "Not allowed to mint new tokens");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of _tokenId");

        uint256 newTokenId = _mintNFTForGovToken(_to, _govToken);
        for (uint i=0; i < _perms.length; i++) {
            _grantPermission(newTokenId, _perms[i]);
        }
    }

    /// @param _tokenId ID of the NFT to burn (destroy)
    function burn(uint256 _tokenId) public {
        delete govTokensByTokenId[_tokenId];
        revokeAllPermissions(_tokenId);
        _burn(_tokenId);
        emit BurnTokenEvent(_tokenId);
    }
}