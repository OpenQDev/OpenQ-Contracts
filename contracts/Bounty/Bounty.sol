// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './Bountyable.sol';

abstract contract Bounty is Bountyable, Ownable {
    constructor(
        string memory _id,
        address _issuer,
        string memory _organization
    ) {
        bountyId = _id;
        status = BountyStatus.OPEN;
        issuer = _issuer;
        organization = _organization;
    }

    // Bounty Accounting
    address[] public bountyTokenAddresses;

    // Funder Accounting
    mapping(address => address[]) public funderTokenAddresses;
    mapping(address => mapping(address => uint256)) public funderDeposits;
    mapping(address => bool) public isAFunder;

    // Issue Metadata
    string public bountyId;
    uint256 public bountyCreatedTime = block.timestamp;
    uint256 public bountyClosedTime;
    uint256 public escrowPeriod = 30 days;
    address public issuer;
    string public organization;
    address public closer;
    BountyStatus public status;

    enum BountyStatus {
        OPEN,
        CLOSED
    }

    // View Methods
    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        ERC20 tokenAddress = ERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function getFunderTokenAddresses(address _funder)
        public
        view
        returns (address[] memory)
    {
        return funderTokenAddresses[_funder];
    }

    function getBountyTokenAddresses() public view returns (address[] memory) {
        return bountyTokenAddresses;
    }
}
