// contracts/Bounty.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './TransferHelper.sol';
import './Bounty.sol';

contract Bounty_v1 is Bounty {
    constructor(
        string memory _id,
        address _issuer,
        string memory _organization
    ) Bounty(_id, _issuer, _organization) {}

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume
    ) public onlyOpenQ returns (bool success) {
        require(_volume != 0, 'Must send a non-zero volume of tokens.');

        // If is a new deposit for that denomination for the entire bounty
        if (getERC20Balance(_tokenAddress) == 0) {
            bountyTokenAddresses.push(_tokenAddress);
        }

        TransferHelper.safeTransferFrom(
            _tokenAddress,
            _funder,
            address(this),
            _volume
        );

        isAFunder[_funder] = true;

        // If is a new deposit for that denomination for that funder
        if (funderDeposits[_funder][_tokenAddress] == 0) {
            funderTokenAddresses[_funder].push(_tokenAddress);
        }

        // Increment the volume that funder has deposited for that denomination
        funderDeposits[_funder][_tokenAddress] += _volume;
        return success;
    }

    function claim(address _payoutAddress, address _tokenAddress)
        public
        onlyOpenQ
        returns (bool success)
    {
        require(
            this.status() == BountyStatus.OPEN,
            'This is bounty is closed. Cannot withdraw again.'
        );

        uint256 bountyBalance = getERC20Balance(_tokenAddress);

        TransferHelper.safeTransfer(
            _tokenAddress,
            _payoutAddress,
            bountyBalance
        );

        return true;
    }

    function closeBounty(address _payoutAddress)
        public
        onlyOpenQ
        returns (bool success)
    {
        require(
            this.status() == BountyStatus.OPEN,
            'This is bounty is already closed. Cannot close again.'
        );
        status = BountyStatus.CLOSED;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        return true;
    }

    function refundBountyDeposit(address _funder, address _tokenAddress)
        public
        onlyOpenQ
        returns (bool success)
    {
        TransferHelper.safeTransfer(
            _tokenAddress,
            _funder,
            funderDeposits[_funder][_tokenAddress]
        );

        // Decrement the volume that funder has deposited for that denomination
        funderDeposits[_funder][_tokenAddress] -= funderDeposits[_funder][
            _tokenAddress
        ];

        return true;
    }

    // Fallback and Receive
    // Revert any attempts to send ETH or unknown calldata
    fallback() external {
        revert();
    }
}
