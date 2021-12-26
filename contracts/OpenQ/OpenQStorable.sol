// contracts/OpenQ.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../Storage/OpenQStorage.sol';

abstract contract OpenQStorable {
    OpenQStorage public openQStorage;

    function setOpenQStorage(address _openQStorage) public {
        openQStorage = OpenQStorage(_openQStorage);
    }

    // Storage Setters/Getters
    function bountyIdToAddress(string memory _bountyId)
        public
        view
        returns (address bountyAddress)
    {
        bytes memory encoded = abi.encode('bountyIdToAddress', _bountyId);
        return openQStorage.getAddress(hash(encoded));
    }

    function setBountyIdToAddress(
        string memory _bountyId,
        address _bountyAddress
    ) public {
        bytes memory encoded = abi.encode('bountyIdToAddress', _bountyId);
        openQStorage.setAddress(hash(encoded), _bountyAddress);
    }

    function bountyAddressToBountyId(address _bountyAddress)
        public
        view
        returns (string memory bountyId)
    {
        bytes memory encoded = abi.encode('bountyAddressToId', _bountyAddress);
        return openQStorage.getString(hash(encoded));
    }

    function setBountyAddressToBountyId(
        address _bountyAddress,
        string memory _bountyId
    ) public {
        bytes memory encoded = abi.encode('bountyAddressToId', _bountyAddress);
        openQStorage.setString(hash(encoded), _bountyId);
    }

    function hash(bytes memory encoded) public pure returns (bytes32) {
        return keccak256(encoded);
    }
}
