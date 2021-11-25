// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';
import 'hardhat/console.sol';

contract Bounty is Ownable {
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
    uint256 public escrowPeriod = 30 days;
    address public issuer;
    address public closer;
    BountyStatus public status;

    enum BountyStatus {
        OPEN,
        CLOSED
    }

    constructor(string memory _id, address _issuer) {
        bountyId = _id;
        status = BountyStatus.OPEN;
        issuer = _issuer;
        bountyCreatedTime = block.timestamp;
    }

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _value
    ) public onlyOwner returns (bool success) {
        require(_value != 0, 'Must send some value');

        // If is a new deposit for that denomination for the entire bounty
        if (getERC20Balance(_tokenAddress) == 0) {
            bountyTokenAddresses.push(_tokenAddress);
        }

        TransferHelper.safeTransferFrom(
            _tokenAddress,
            _funder,
            address(this),
            _value
        );

        isAFunder[_funder] = true;

        // If is a new deposit for that denomination for that funder
        if (funderDeposits[_funder][_tokenAddress] == 0) {
            funderTokenAddresses[_funder].push(_tokenAddress);
        }

        // Increment the value that funder has deposited for that denomination
        funderDeposits[_funder][_tokenAddress] += _value;
        return success;
    }

    function claim(address _payoutAddress)
        public
        onlyOwner
        returns (bool success)
    {
        require(
            this.status() == BountyStatus.OPEN,
            'This is bounty is closed. Cannot withdraw again.'
        );

        for (uint256 i; i < bountyTokenAddresses.length; i++) {
            uint256 bountyBalance = getERC20Balance(bountyTokenAddresses[i]);

            TransferHelper.safeTransfer(
                bountyTokenAddresses[i],
                _payoutAddress,
                bountyBalance
            );
        }

        status = BountyStatus.CLOSED;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        return true;
    }

    function refundBountyDeposit(address _funder, address _tokenAddress)
        public
        onlyOwner
        returns (bool success)
    {
        TransferHelper.safeTransfer(
            _tokenAddress,
            _funder,
            funderDeposits[_funder][_tokenAddress]
        );

        // Decrement the value that funder has deposited for that denomination
        funderDeposits[_funder][_tokenAddress] -= funderDeposits[_funder][
            _tokenAddress
        ];

        return true;
    }

    // Convenience Methods
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
