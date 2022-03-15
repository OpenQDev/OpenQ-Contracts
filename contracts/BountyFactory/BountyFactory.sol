// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/proxy/Clones.sol';
import '../Bounty/Implementations/BountyV0.sol';

contract BountyFactory is OpenQOnlyAccess {
    address public immutable bountyImplementation;

    constructor(address _openQ) {
        bountyImplementation = address(new BountyV0());
        __OpenQOnlyAccess_init(_openQ);
    }

    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization,
        address _openQ
    ) external onlyOpenQ returns (address) {
        address clone = Clones.cloneDeterministic(
            bountyImplementation,
            keccak256(abi.encode(_id))
        );

        BountyV0(payable(clone)).initialize(
            _id,
            _issuer,
            _organization,
            _openQ
        );

        return clone;
    }

    function predictDeterministicAddress(string memory _id)
        external
        view
        returns (address predicted)
    {
        return
            Clones.predictDeterministicAddress(
                bountyImplementation,
                keccak256(abi.encode(_id)),
                address(this)
            );
    }
}
