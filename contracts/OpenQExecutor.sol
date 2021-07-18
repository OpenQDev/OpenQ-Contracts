// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import './OracleStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/* 
OpenQExecutor is responsible for administration of all OpenQ contract address updates.
OpenQExecutor's methods are all Ownable by it's initial msg.sender.
In turn, other contracts (like Storage) can only be updated by calling methods on this OpenQExecutor.
This is done by setting the OpenQExecutor address in OpenQStorage to this contracts address.

This allows for a separation of administration tasks from business logic.

The same contract that does things like calculate ETH/USD price need not be the same contract that adds oracle jobs.
*/
contract OpenQExecutor is Ownable {
    // ------------ ORACLE STORAGE ------------ //
    OracleStorage public oracleStorage;

    constructor(address _oracleStorage) {
        _setOracleStorage(_oracleStorage);
    }

    function _setOracleStorage(address _oracleStorage) internal {
        oracleStorage = OracleStorage(_oracleStorage);
        emit SetOracleStorageEvent(_oracleStorage);
    }

    function addOracle(
        address _oracle,
        string calldata _name,
        string[] memory _jobNames,
        OracleStorage.Job[] memory _jobs
    ) external onlyOwner {
        oracleStorage.addOracle(_oracle, _name, _jobNames, _jobs);
    }

    function removeOracle(address _oracle) external onlyOwner {
        oracleStorage.removeOracle(_oracle);
    }

    function changeOracleName(address _oracle, string calldata _name)
        external
        onlyOwner
    {
        oracleStorage.changeOracleName(_oracle, _name);
    }

    function addOracleJob(
        address _oracle,
        string calldata _jobName,
        OracleStorage.Job memory _job
    ) external onlyOwner {
        oracleStorage.addOracleJob(_oracle, _jobName, _job);
    }

    function removeOracleJob(address _oracle, string calldata _jobName)
        external
        onlyOwner
    {
        oracleStorage.removeOracleJob(_oracle, _jobName);
    }
}
