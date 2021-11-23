// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';

contract Issue is Ownable {
    mapping(address => bool) public isAFunder;
    mapping(address => address[]) public fundersTokenAddresses;

    function getFundersTokenAddresses(address _funder)
        public
        view
        returns (address[] memory)
    {
        return fundersTokenAddresses[_funder];
    }

    mapping(address => mapping(address => uint256)) public funders;

    uint256 public issueTime;
    uint256 public escrowPeriod = 30 days;
    address public issuer;

    string public issueId;
    address public closer;
    address[] public tokenAddresses;

    enum IssueStatus {
        OPEN,
        CLOSED
    }

    IssueStatus public status;

    constructor(
        string memory _id,
        address _issuer,
        address[] memory _tokenAddresses
    ) {
        issueId = _id;
        tokenAddresses = _tokenAddresses;
        status = IssueStatus.OPEN;
        issuer = _issuer;
        issueTime = block.timestamp;
    }

    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        ERC20 tokenAddress = ERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function refundBountyDeposit(address _funder, address _tokenAddress)
        public
        onlyOwner
        returns (bool success)
    {
        TransferHelper.safeTransfer(
            _tokenAddress,
            _funder,
            funders[_funder][_tokenAddress]
        );
        return true;
    }

    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _value
    ) public returns (bool success) {
        require(_value != 0, 'Must send some value');
        isAFunder[_funder] = true;
        TransferHelper.safeTransferFrom(
            _tokenAddress,
            _funder,
            address(this),
            _value
        );

        // If is a new deposit
        if (funders[_funder][_tokenAddress] == 0) {
            fundersTokenAddresses[_funder].push(_tokenAddress);
        }

        funders[_funder][_tokenAddress] += _value;
        return success;
    }

    function transferAllERC20(address _payoutAddress) public onlyOwner {
        require(
            this.status() == IssueStatus.OPEN,
            'This is issue is closed. Cannot withdraw again.'
        );

        for (uint256 i; i < tokenAddresses.length; i++) {
            ERC20 tokenContract = ERC20(tokenAddresses[i]);
            tokenContract.transfer(
                _payoutAddress,
                tokenContract.balanceOf(address(this))
            );
        }
        status = IssueStatus.CLOSED;
        closer = _payoutAddress;
    }
}
