// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import 'hardhat/console.sol';

// Custom
import '../Bounty.sol';

contract BountyV0 is Bounty {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        bool _isNft,
        uint256 _tokenId
    )
        public
        payable
        onlyOpenQ
        nonReentrant
        returns (
            bytes32,
            string memory,
            uint256
        )
    {
        require(_volume != 0, 'ZERO_VOLUME_SENT');

        uint256 volumeReceived;

        console.log(volumeReceived);

        if (_tokenAddress == address(0)) {
            payable(_funder).transfer(msg.value);
            volumeReceived = msg.value;
        } else if (_isNft) {
            IERC721 nft = IERC721(_tokenAddress);
            nft.safeTransferFrom(_funder, address(this), _tokenId);
        } else {
            uint256 balanceBefore = getERC20Balance(_tokenAddress);
            IERC20 token = IERC20(_tokenAddress);
            token.safeTransferFrom(_funder, address(this), _volume);
            uint256 balanceAfter = getERC20Balance(_tokenAddress);
            require(
                balanceAfter >= balanceBefore,
                'TOKEN_TRANSFER_IN_OVERFLOW'
            );

            // NOTE: The reason we take the balanceBefore and balanceAfter rather than the raw deposited amount
            // is because certain ERC20's like USDT take fees on transfers. Therefore the volume received after transferFrom
            // can be lower than the raw volume sent by the sender
            volumeReceived = balanceAfter.sub(balanceBefore);
        }

        bytes32 depositId = keccak256(
            abi.encode(_funder, _tokenAddress, depositCount)
        );

        string memory tokenStandard;
        if (_tokenAddress == address(0)) {
            tokenStandard = 'protocol';
        } else if (_isNft) {
            tokenStandard = 'erc721';
        } else {
            tokenStandard = 'erc20';
        }

        Deposit memory deposit = Deposit(
            depositId,
            _funder,
            _tokenAddress,
            volumeReceived,
            block.timestamp,
            false,
            false,
            tokenStandard,
            address(0),
            _tokenId
        );

        funderDeposits[_funder][depositId] = deposit;
        deposits.push(deposit);
        depositIdToDeposit[depositId] = deposit;

        isAFunder[_funder] = true;
        depositCount++;

        return (depositId, tokenStandard, volumeReceived);
    }

    function claim(address _payoutAddress, bytes32 depositId)
        external
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(this.status() == BountyStatus.OPEN, 'CLAIMING_CLOSED_BOUNTY');
        Deposit storage deposit = depositIdToDeposit[depositId];
        require(!deposit.refunded, 'CLAIMING_REFUNDED_DEPOSIT');
        require(!deposit.claimed, 'CLAIMING_CLAIMED_DEPOSIT');

        if (stringEquals(deposit.tokenStandard, 'protocol')) {
            payable(_payoutAddress).transfer(deposit.volume);
        } else if (stringEquals(deposit.tokenStandard, 'erc20')) {
            IERC20 token = IERC20(deposit.tokenAddress);
            token.safeTransfer(_payoutAddress, deposit.volume);
        } else {
            IERC721 nft = IERC721(deposit.tokenAddress);
            nft.safeTransferFrom(
                address(this),
                _payoutAddress,
                deposit.tokenId
            );
        }

        deposit.claimed = true;
        deposit.payoutAddress = _payoutAddress;

        return true;
    }

    function closeBounty(address _payoutAddress)
        external
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
        external
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
