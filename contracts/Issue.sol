// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Issue is Ownable {
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

    modifier onlyIssuer() {
        require(
            msg.sender == issuer,
            'Only issuer of this bounty can reclaim funds after 30 days'
        );
        _;
    }

    function issuerWithdraw() public onlyIssuer {
        require(
            block.timestamp >= issueTime + escrowPeriod,
            'Too early to withdraw funds'
        );

        for (uint256 i; i < tokenAddresses.length; i++) {
            ERC20 tokenContract = ERC20(tokenAddresses[i]);
            tokenContract.transfer(
                msg.sender,
                tokenContract.balanceOf(address(this))
            );
        }
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
