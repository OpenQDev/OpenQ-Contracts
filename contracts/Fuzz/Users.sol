// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

// Use this to get a constant User address
contract Users {
    function proxy(address target, bytes memory data)
        public
        returns (bool success, bytes memory returnData)
    {
        return target.call(data);
    }

    // (bool success, ) = user.proxy(address(openQ), abi.encodeWithSelector(openQ.mintBounty.selector, ...args));

    // for overloaded overrides
    // bytes4(keccak256("mint(address)"))
}
