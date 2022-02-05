// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';

// Custom
import './Bountyable.sol';

abstract contract Bounty is Bountyable, ReentrancyGuardUpgradeable {
    // OpenQ Contract
    address openQ;

    // Bounty Accounting
    address[] public bountyTokenAddresses;

    // Funder Accounting
    // funder -> [ tokenAddres -> [Deposit] ]
    mapping(address => mapping(bytes32 => Deposit)) public funderDeposits;
    mapping(address => bool) public isAFunder;

    // Bounty Metadata
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    uint256 public escrowPeriod;
    address public issuer;
    string public organization;
    address public closer;
    BountyStatus public status;

    struct Deposit {
        bytes32 depositId;
        address funder;
        address tokenAddress;
        uint256 volume;
        uint256 depositTime;
        bool refunded;
    }

    modifier onlyOpenQ() {
        require(msg.sender == openQ, 'Method is only callable by OpenQ');
        _;
    }

    function initialize(
        string memory _id,
        address _issuer,
        string memory _organization,
        address _openQ
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
        openQ = _openQ;
        escrowPeriod = 2 seconds;
        __ReentrancyGuard_init();
    }

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

    function getBountyTokenAddresses() public view returns (address[] memory) {
        return bountyTokenAddresses;
    }

    // Revert any attempts to send ETH or unknown calldata
    fallback() external {
        revert();
    }
}
