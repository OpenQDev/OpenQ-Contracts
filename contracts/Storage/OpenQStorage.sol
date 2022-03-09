// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

// Custom
import './interfaces/EternalStorage.sol';

/// @title The primary persistent storage for Rocket Pool
/// @author David Rugendyke

contract OpenQStorage is EternalStorage {
    // Libraries
    using SafeMath for uint256;
    address public guardian;

    // Storage maps
    // Scalars
    mapping(bytes32 => string) private stringStorage;
    mapping(bytes32 => bytes) private bytesStorage;
    mapping(bytes32 => uint256) private uintStorage;
    mapping(bytes32 => int256) private intStorage;
    mapping(bytes32 => address) private addressStorage;
    mapping(bytes32 => bool) private booleanStorage;
    mapping(bytes32 => bytes32) private bytes32Storage;

    /// @dev Construct RocketStorage
    constructor() {
        // Set the guardian upon deployment
        guardian = msg.sender;
    }

    /// @param _key The key for the record
    function getAddress(bytes32 _key)
        external
        view
        override
        returns (address r)
    {
        return addressStorage[_key];
    }

    /// @param _key The key for the record
    function getUint(bytes32 _key) external view override returns (uint256 r) {
        return uintStorage[_key];
    }

    /// @param _key The key for the record
    function getString(bytes32 _key)
        external
        view
        override
        returns (string memory)
    {
        return stringStorage[_key];
    }

    /// @param _key The key for the record
    function getBytes(bytes32 _key)
        external
        view
        override
        returns (bytes memory)
    {
        return bytesStorage[_key];
    }

    /// @param _key The key for the record
    function getBool(bytes32 _key) external view override returns (bool r) {
        return booleanStorage[_key];
    }

    /// @param _key The key for the record
    function getInt(bytes32 _key) external view override returns (int256 r) {
        return intStorage[_key];
    }

    /// @param _key The key for the record
    function getBytes32(bytes32 _key)
        external
        view
        override
        returns (bytes32 r)
    {
        return bytes32Storage[_key];
    }

    /// @param _key The key for the record
    function setAddress(bytes32 _key, address _value) external override {
        addressStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setUint(bytes32 _key, uint256 _value) external override {
        uintStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setString(bytes32 _key, string calldata _value) external override {
        stringStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setBytes(bytes32 _key, bytes calldata _value) external override {
        bytesStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setBool(bytes32 _key, bool _value) external override {
        booleanStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setInt(bytes32 _key, int256 _value) external override {
        intStorage[_key] = _value;
    }

    /// @param _key The key for the record
    function setBytes32(bytes32 _key, bytes32 _value) external override {
        bytes32Storage[_key] = _value;
    }

    /// @param _key The key for the record
    function deleteAddress(bytes32 _key) external override {
        delete addressStorage[_key];
    }

    /// @param _key The key for the record
    function deleteUint(bytes32 _key) external override {
        delete uintStorage[_key];
    }

    /// @param _key The key for the record
    function deleteString(bytes32 _key) external override {
        delete stringStorage[_key];
    }

    /// @param _key The key for the record
    function deleteBytes(bytes32 _key) external override {
        delete bytesStorage[_key];
    }

    /// @param _key The key for the record
    function deleteBool(bytes32 _key) external override {
        delete booleanStorage[_key];
    }

    /// @param _key The key for the record
    function deleteInt(bytes32 _key) external override {
        delete intStorage[_key];
    }

    /// @param _key The key for the record
    function deleteBytes32(bytes32 _key) external override {
        delete bytes32Storage[_key];
    }

    /// @param _key The key for the record
    /// @param _amount An amount to add to the record's value
    function addUint(bytes32 _key, uint256 _amount) external override {
        uintStorage[_key] = uintStorage[_key].add(_amount);
    }

    /// @param _key The key for the record
    /// @param _amount An amount to subtract from the record's value
    function subUint(bytes32 _key, uint256 _amount) external override {
        uintStorage[_key] = uintStorage[_key].sub(_amount);
    }
}
