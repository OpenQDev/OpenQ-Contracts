// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../KYC/IKycValidity.sol';

contract MockKyc is IKycValidity {
		mapping(address => bool) isValid;

    function setIsValid(address _address) external {
        isValid[_address] = true;
    }

    function hasValidToken(address _address) external view returns (bool valid) {
        return isValid[_address];
    }
}
