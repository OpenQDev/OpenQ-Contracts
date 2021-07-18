// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './OpenQStorage.sol';

// This contract acts as Octobay's oracle storage.
contract OracleStorage is OpenQStorage {
    struct Job {
        bytes32 providerId;
        bytes32 requesterIndex;
        bytes32 endpointId;
    }

    struct Oracle {
        string name;
        mapping(string => Job) jobs;
    }

    address[] public registeredOracles;
    mapping(address => Oracle) public oracles;
    mapping(address => string[]) public oracleJobNames;

    event OracleAddedEvent(address oracle, string name);
    event OracleRemovedEvent(address oracle);
    event OracleNameChangedEvent(address oracle, string name);
    event OracleJobAddedEvent(address oracle, string name, bytes32 id);
    event OracleJobRemovedEvent(address oracle, string name, bytes32 id);

    modifier onlyRegisteredOracle(address _oracle) {
        require(
            bytes(oracles[_oracle].name).length > 0,
            'OracleStorage: Unregistered oracle'
        );
        _;
    }

    function addOracle(address _oracle, string calldata _name)
        external
        onlyOctobay
    {
        require(
            bytes(oracles[_oracle].name).length == 0,
            'OracleStorage: Oracle already exists'
        );

        oracles[_oracle] = Oracle({name: _name});
        for (uint256 i = 0; i < _jobNames.length; i++) {
            oracleJobNames[_oracle].push(_jobNames[i]);
        }
        registeredOracles.push(_oracle);

        emit OracleAddedEvent(_oracle, _name);
    }

    function removeOracle(address _oracle)
        external
        onlyOctobay
        onlyRegisteredOracle(_oracle)
    {
        for (uint256 i = 0; i < registeredOracles.length; i++) {
            if (registeredOracles[i] == _oracle) {
                registeredOracles[i] = registeredOracles[
                    registeredOracles.length - 1
                ];
                registeredOracles.pop();
                for (uint256 j = 0; j < oracleJobNames[_oracle].length; j++) {
                    emit OracleJobRemovedEvent(
                        _oracle,
                        oracleJobNames[_oracle][j],
                        oracles[_oracle].jobs[oracleJobNames[_oracle][j]].id
                    );
                }
                delete oracleJobNames[_oracle];
            }
        }
        delete oracles[_oracle];
        emit OracleRemovedEvent(_oracle);
    }

    function changeOracleName(address _oracle, string calldata _name)
        external
        onlyOctobay
        onlyRegisteredOracle(_oracle)
    {
        oracles[_oracle].name = _name;
        emit OracleNameChangedEvent(_oracle, _name);
    }

    function addOracleJob(
        address _oracle,
        string calldata _jobName,
        Job memory _job
    ) external onlyOctobay onlyRegisteredOracle(_oracle) {
        oracles[_oracle].jobs[_jobName] = _job;
        emit OracleJobAddedEvent(_oracle, _jobName, _job.id);
    }

    function removeOracleJob(address _oracle, string calldata _jobName)
        external
        onlyOctobay
        onlyRegisteredOracle(_oracle)
    {
        emit OracleJobRemovedEvent(
            _oracle,
            _jobName,
            oracles[_oracle].jobs[_jobName].id
        );
        delete oracles[_oracle].jobs[_jobName];
    }

    function getOracleName(address _oracle)
        external
        view
        returns (string memory)
    {
        return oracles[_oracle].name;
    }

    function getOracleJob(address _oracle, string calldata _job)
        external
        view
        returns (bytes32, uint256)
    {
        Job memory job = oracles[_oracle].jobs[_job];
        return (job.id, job.fee);
    }

    function oracleExists(address _oracle) public view returns (bool) {
        return bytes(oracles[_oracle].name).length > 0;
    }

    function oracleJobExists(address _oracle, string calldata _jobName)
        public
        view
        returns (bool)
    {
        return oracles[_oracle].jobs[_jobName].id > 0;
    }
}
