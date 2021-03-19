// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './OctobayStorage.sol';

contract OctobayGovToken is OctobayStorage, ERC20 {

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
    function transferFrom(address _sender, address _recipient, uint256 _amount) public override onlyOctobay returns (bool) {
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    /// @notice Explicitly disabling transfers by individual owners 
    function transfer(address, uint256) public override returns (bool) {
        require(false, "Transfers are only allowed by the Octobay contract");
    }
}
