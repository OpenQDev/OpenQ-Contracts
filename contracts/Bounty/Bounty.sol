// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import './Bountyable.sol';

abstract contract Bounty is Bountyable, Initializable {
    address openQImplementation;

    modifier onlyOpenQ() {
        require(
            msg.sender == openQImplementation,
            'Method is only callable by the current OpenQ implementation'
        );
        _;
    }

    function initialize(
        string memory _id,
        address _issuer,
        string memory _organization,
        address _openQImplementation
    ) public initializer {
        require(bytes(_id).length != 0, 'id cannot be empty string!');
        require(
            bytes(_organization).length != 0,
            'organization cannot be empty string!'
        );
        bountyId = _id;
        issuer = _issuer;
        organization = _organization;
        bountyCreatedTime = block.timestamp;
        openQImplementation = _openQImplementation;
        escrowPeriod = 30 seconds;
    }

    // Bounty Accounting
    address[] public bountyTokenAddresses;

    // Funder Accounting
    mapping(address => address[]) public funderTokenAddresses;
    mapping(address => mapping(address => uint256)) public funderDeposits;
    mapping(address => bool) public isAFunder;

    // Issue Metadata
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    uint256 public escrowPeriod;
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
        IERC20 tokenAddress = IERC20(_tokenAddress);
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
