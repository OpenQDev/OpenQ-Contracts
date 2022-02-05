// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

// Custom
import '../Bounty.sol';

contract BountyV0 is Bounty {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume
    ) public onlyOpenQ nonReentrant returns (bytes32, uint256) {
        require(_volume != 0, 'ZERO_VOLUME_SENT');

        // Add to token addresses if it's a new token address
        if (getERC20Balance(_tokenAddress) == 0) {
            bountyTokenAddresses.push(_tokenAddress);
        }

        uint256 balanceBefore = getERC20Balance(_tokenAddress);

        IERC20 token = IERC20(_tokenAddress);

        token.safeTransferFrom(_funder, address(this), _volume);

        uint256 balanceAfter = getERC20Balance(_tokenAddress);

        require(balanceAfter >= balanceBefore, 'TOKEN_TRANSFER_IN_OVERFLOW');

        // NOTE: The reason we take the balanceBefore and balanceAfter rather than the raw deposited amount
        // is because certain ERC20's like USDT take fees on transfers. Therefore the volume received after transferFrom
        // can be lower than the raw volume sent by the sender
        uint256 volumeReceived = balanceAfter.sub(balanceBefore);

        bytes32 depositId = keccak256(
            abi.encode(_funder, _tokenAddress, depositCount)
        );

        Deposit memory deposit = Deposit(
            depositId,
            _funder,
            _tokenAddress,
            volumeReceived,
            block.timestamp,
            false
        );

        funderDeposits[_funder][depositId] = deposit;
        isAFunder[_funder] = true;
        depositCount++;
        return (depositId, volumeReceived);
    }

    function claim(address _payoutAddress, address _tokenAddress)
        public
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(this.status() == BountyStatus.OPEN, 'CLAIMING_CLOSED_BOUNTY');
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
        require(this.status() == BountyStatus.OPEN, 'CLOSING_CLOSED_BOUNTY');
        status = BountyStatus.CLOSED;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        return true;
    }

    function refundBountyDeposit(address _funder, bytes32 depositId)
        public
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        Deposit storage deposit = funderDeposits[_funder][depositId];
        uint256 amount = deposit.volume;

        // Check
        require(deposit.refunded == false, 'BOUNTY_ALREADY_REFUNDED');

        // Effects
        deposit.volume = 0;
        deposit.refunded = true;

        // Interactions
        IERC20 token = IERC20(deposit.tokenAddress);
        token.safeTransfer(_funder, amount);
        return true;
    }
}
