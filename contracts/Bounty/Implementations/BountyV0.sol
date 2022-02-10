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
        uint256 _expiration
    ) public payable onlyOpenQ nonReentrant returns (bytes32, uint256) {
        require(_volume != 0, 'ZERO_VOLUME_SENT');

        uint256 volumeReceived;

        if (_tokenAddress == address(0)) {
            volumeReceived = msg.value;
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
            abi.encode(_funder, _tokenAddress, deposits.length)
        );

        funder[depositId] = _funder;
        tokenAddress[depositId] = _tokenAddress;
        volume[depositId] = volumeReceived;
        depositTime[depositId] = block.timestamp;
        expiration[depositId] = _expiration;
        isNFT[depositId] = false;

        deposits.push(depositId);

        isAFunder[_funder] = true;

        return (depositId, volumeReceived);
    }

    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) public onlyOpenQ nonReentrant returns (bytes32) {
        IERC721 nft = IERC721(_tokenAddress);
        nft.safeTransferFrom(_sender, address(this), _tokenId);

        bytes32 depositId = keccak256(
            abi.encode(_sender, _tokenAddress, deposits.length)
        );

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        deposits.push(depositId);

        isAFunder[_sender] = true;

        return (depositId);
    }

    function claim(address _payoutAddress, bytes32 depositId)
        external
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(this.status() == BountyStatus.OPEN, 'CLAIMING_CLOSED_BOUNTY');

        require(!refunded[depositId], 'CLAIMING_REFUNDED_DEPOSIT');
        require(!claimed[depositId], 'CLAIMING_CLAIMED_DEPOSIT');

        if (tokenAddress[depositId] == address(0)) {
            payable(_payoutAddress).transfer(volume[depositId]);
        } else if (isNFT[depositId]) {
            IERC721 nft = IERC721(tokenAddress[depositId]);
            nft.safeTransferFrom(
                address(this),
                _payoutAddress,
                tokenId[depositId]
            );
        } else {
            IERC20 token = IERC20(tokenAddress[depositId]);
            token.safeTransfer(_payoutAddress, volume[depositId]);
        }

        claimed[depositId] = true;
        payoutAddress[depositId] = _payoutAddress;

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

    function refundBountyDeposit(bytes32 _depositId)
        external
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        // Check
        require(refunded[_depositId] == false, 'BOUNTY_ALREADY_REFUNDED');

        // Effects
        refunded[_depositId] = true;

        // Interactions
        if (tokenAddress[_depositId] == address(0)) {
            payable(funder[_depositId]).transfer(volume[_depositId]);
        } else if (isNFT[_depositId]) {
            IERC721 nft = IERC721(tokenAddress[_depositId]);
            nft.safeTransferFrom(
                address(this),
                funder[_depositId],
                tokenId[_depositId]
            );
        } else {
            IERC20 token = IERC20(tokenAddress[_depositId]);
            token.safeTransfer(funder[_depositId], volume[_depositId]);
        }

        return true;
    }
}
