// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../Bounty.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract BountyV0 is Bounty {
    using SafeERC20 for IERC20;

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume
    ) public onlyOpenQ returns (uint256) {
        require(_volume != 0, 'Must send a non-zero volume of tokens.');

        // If is a new deposit for that denomination for the entire bounty
        if (getERC20Balance(_tokenAddress) == 0) {
            bountyTokenAddresses.push(_tokenAddress);
        }

        uint256 balanceBefore = getERC20Balance(_tokenAddress);

        IERC20 token = IERC20(_tokenAddress);

        token.safeTransferFrom(_funder, address(this), _volume);

        isAFunder[_funder] = true;

        // If is a new deposit for that denomination for that funder
        if (funderDeposits[_funder][_tokenAddress] == 0) {
            funderTokenAddresses[_funder].push(_tokenAddress);
        }

        uint256 balanceAfter = getERC20Balance(_tokenAddress);

        require(balanceAfter >= balanceBefore, 'TOKEN_TRANSFER_IN_OVERFLOW');

        uint256 volumeReceived = balanceAfter - balanceBefore;

        // Increment the volume that funder has deposited for that denomination
        // NOTE: The reason we take the balanceBefore and balanceAfter rather than the raw deposited amount
        // is because certain ERC20's like USDT take fees on transfers, so the received amount after transferFrom
        // will be lower than the raw volume
        funderDeposits[_funder][_tokenAddress] += volumeReceived;
        return volumeReceived;
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
        IERC20 token = IERC20(_tokenAddress);
        token.safeTransfer(_payoutAddress, bountyBalance);
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
        IERC20 token = IERC20(_tokenAddress);

        token.safeTransfer(_funder, funderDeposits[_funder][_tokenAddress]);

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
