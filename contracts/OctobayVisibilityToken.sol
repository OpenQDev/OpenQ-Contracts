// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './OctobayClient.sol';

contract OctobayVisibilityToken is OctobayClient, ERC20('Octobay Visibility Token', 'OVT') {
    function mint(address _to, uint256 _amount) external onlyOctobayClient {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOctobayClient {
        _burn(_from, _amount);
    }
}
