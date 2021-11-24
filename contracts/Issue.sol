// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';

contract Issue is Ownable {
    // Bounty Accounting
    address[] public bountyTokenAddresses;
    mapping(address => uint256) public bountyDeposits;

    // Funder Accounting
    mapping(address => address[]) public funderTokenAddresses;
    mapping(address => mapping(address => uint256)) public funderDeposits;
    mapping(address => bool) public isAFunder;

    // Issue Metadata
    string public issueId;
    uint256 public issueCreatedTime;
    uint256 public issueClosedTime;
    uint256 public escrowPeriod = 30 days;
    address public issuer;
    address public closer;
    IssueStatus public status;

    enum IssueStatus {
        OPEN,
        CLOSED
    }

    constructor(string memory _id, address _issuer) {
        issueId = _id;
        status = IssueStatus.OPEN;
        issuer = _issuer;
        issueCreatedTime = block.timestamp;
    }

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _value
    ) public onlyOwner returns (bool success) {
        require(_value != 0, 'Must send some value');

        TransferHelper.safeTransferFrom(
            _tokenAddress,
            _funder,
            address(this),
            _value
        );

        isAFunder[_funder] = true;

        // If is a new deposit for that denomination for the entire bounty
        if (bountyDeposits[_tokenAddress] == 0) {
            bountyTokenAddresses.push(_tokenAddress);
        }

        // If is a new deposit for that denomination for that funder
        if (funderDeposits[_funder][_tokenAddress] == 0) {
            funderTokenAddresses[_funder].push(_tokenAddress);
        }

        // Increment the total value locked for this denomination
        bountyDeposits[_tokenAddress] += _value;

        // Increment the value that funder has deposited for that denomination
        funderDeposits[_funder][_tokenAddress] += _value;
        return success;
    }

    function transferAllERC20(address _payoutAddress)
        public
        onlyOwner
        returns (bool success)
    {
        require(
            this.status() == IssueStatus.OPEN,
            'This is issue is closed. Cannot withdraw again.'
        );

        for (uint256 i; i < bountyTokenAddresses.length; i++) {
            ERC20 tokenContract = ERC20(bountyTokenAddresses[i]);
            tokenContract.transfer(
                _payoutAddress,
                tokenContract.balanceOf(address(this))
            );
        }

        status = IssueStatus.CLOSED;
        closer = _payoutAddress;
        issueClosedTime = block.timestamp;
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
