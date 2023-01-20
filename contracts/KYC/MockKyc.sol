// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './IKycValidity.sol';

contract MockKyc is IKycValidity {
    bool public isValid;

    function setIsValid(bool _isValid) external {
        isValid = _isValid;
    }

    function hasValidToken(address _addr) external view returns (bool valid) {
        return isValid;
    }
}
