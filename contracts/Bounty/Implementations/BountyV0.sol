// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
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
    )
        public
        payable
        override
        onlyOpenQ
        nonReentrant
        returns (bytes32, uint256)
    {
        require(_volume != 0, 'ZERO_VOLUME_SENT');

        bytes32 depositId = _generateDepositId(_funder, _tokenAddress);

        uint256 volumeReceived;
        if (_tokenAddress == address(0)) {
            volumeReceived = msg.value;
        } else {
            volumeReceived = _receiveERC20(_tokenAddress, _funder, _volume);
        }

        funder[depositId] = _funder;
        tokenAddress[depositId] = _tokenAddress;
        volume[depositId] = volumeReceived;
        depositTime[depositId] = block.timestamp;
        expiration[depositId] = _expiration;
        isNFT[depositId] = false;

        deposits.push(depositId);

        return (depositId, volumeReceived);
    }

    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) public override onlyOpenQ nonReentrant returns (bytes32) {
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId(_sender, _tokenAddress);

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        deposits.push(depositId);

        return (depositId);
    }

    function refundDeposit(bytes32 _depositId, address _funder)
        external
        override
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        // Check
        require(refunded[_depositId] == false, 'BOUNTY_ALREADY_REFUNDED');
        require(
            funder[_depositId] == _funder,
            'ONLY_FUNDER_CAN_REQUEST_REFUND'
        );
        require(
            block.timestamp >=
                depositTime[_depositId].add(expiration[_depositId]),
            'PREMATURE_REFUND_REQUEST'
        );

        // Effects
        refunded[_depositId] = true;

        // Interactions
        if (tokenAddress[_depositId] == address(0)) {
            _transferProtocolToken(funder[_depositId], volume[_depositId]);
        } else if (isNFT[_depositId]) {
            _transferNft(
                tokenAddress[_depositId],
                funder[_depositId],
                tokenId[_depositId]
            );
        } else {
            _transferERC20(
                tokenAddress[_depositId],
                funder[_depositId],
                volume[_depositId]
            );
        }

        return true;
    }

    function claim(address _payoutAddress, bytes32 depositId)
        external
        override
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(this.status() == BountyStatus.OPEN, 'CLAIMING_CLOSED_BOUNTY');
        require(!refunded[depositId], 'CLAIMING_REFUNDED_DEPOSIT');
        require(!claimed[depositId], 'CLAIMING_CLAIMED_DEPOSIT');

        if (tokenAddress[depositId] == address(0)) {
            _transferProtocolToken(_payoutAddress, volume[depositId]);
        } else if (isNFT[depositId]) {
            _transferNft(
                tokenAddress[depositId],
                _payoutAddress,
                tokenId[depositId]
            );
        } else {
            _transferERC20(
                tokenAddress[depositId],
                _payoutAddress,
                volume[depositId]
            );
        }

        claimed[depositId] = true;
        payoutAddress[depositId] = _payoutAddress;

        return true;
    }

    function close(address _payoutAddress)
        external
        override
        onlyOpenQ
        returns (bool success)
    {
        require(this.status() == BountyStatus.OPEN, 'CLOSING_CLOSED_BOUNTY');
        status = BountyStatus.CLOSED;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        return true;
    }
}
