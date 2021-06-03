// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20Snapshot.sol';
import './OctobayStorage.sol';

/// @notice Owners or repos or orgs can create new gov tokens which are used to vote on proposals.
///         New tokens are minted and awarded to those who complete bounties for the associated repo or org.
contract OctobayGovToken is OctobayStorage, ERC20Snapshot {

    /// @param _name Name of the new token
    /// @param _symbol Token Symbol for the new token
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) public {}

    /// @param _to Address of recipient for new tokens
    /// @param _amount Amount of new tokens to create
    function mint(address _to, uint256 _amount) external onlyOctobay {
        _mint(_to, _amount);
    }

    /// @param _from Address from whose tokens will be destroyed
    /// @param _amount Amount of tokens to destroy
    function burn(address _from, uint256 _amount) external onlyOctobay {
        _burn(_from, _amount);
    }

    /// @param _sender Address from whose tokens will be taken
    /// @param _recipient Address of who will receive the tokens
    /// @param _amount Amount of tokens to send
    /// @return Whether the transfer was successful
    function transferFrom(address _sender, address _recipient, uint256 _amount) public override onlyOctobay returns (bool) {
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    /// @notice Explicitly disabling transfers by individual owners 
    function transfer(address, uint256) public override returns (bool) {
        require(false, "OctobayGovToken: Transfers are only allowed by the Octobay contract");
    }

    /// @param _account Address for whose balance we're asking
    /// @return The balance of the given account as a percentage of total supply (0 - 10000) 
    function balanceOfAsPercent(address _account) public view returns (uint16) {
        if (totalSupply() > 0) {
            return uint16((balanceOf(_account) / totalSupply()) * 10000);
        }
        return 0;
    }

    /// @param _account Address for whose balance we're asking
    /// @param _snapshotId Snapshot ID for the block at whose balance we'd like to check
    /// @return The balance of the given account as a percentage of total supply (0 - 10000) 
    function balanceOfAsPercentAt(address _account, uint256 _snapshotId) public view returns (uint16) {
        if (totalSupplyAt(_snapshotId) > 0) {
            return uint16((balanceOfAt(_account, _snapshotId) / totalSupplyAt(_snapshotId)) * 10000);
        }
        return 0;
    }

    /// @notice Open to all at the moment, but we could limit this to only the governor if needed
    /// @return The ID of the snapshot, used later to look up balances and totalSupply at a certain block
    function snapshot() external returns (uint256) {
        return _snapshot();
    }        
}
