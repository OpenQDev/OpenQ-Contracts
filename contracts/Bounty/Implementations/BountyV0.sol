// SPDX-License-Identifier: BUSL-1.1
// NO HACKERS ALLOWED PLEASE THANKS!
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

// Custom
import '../Bounty.sol';

contract BountyV0 is Bounty {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    )
        external
        payable
        override
        onlyOpenQ
        nonReentrant
        returns (bytes32, uint256)
    {
        require(_volume != 0, 'ZERO_VOLUME_SENT');
        require(_expiration > 0, 'EXPIRATION_NOT_GREATER_THAN_ZERO');

        bytes32 depositId = _generateDepositId();

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
        tokenAddresses.add(_tokenAddress);

        return (depositId, volumeReceived);
    }

    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) external override onlyOpenQ nonReentrant returns (bytes32) {
        require(
            nftDeposits.length < nftDepositLimit,
            'NFT_DEPOSIT_LIMIT_REACHED'
        );
        require(_expiration > 0, 'EXPIRATION_NOT_GREATER_THAN_ZERO');
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId();

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    function refundDeposit(bytes32 _depositId, address _funder)
        external
        override
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        // Check
        require(refunded[_depositId] == false, 'DEPOSIT_ALREADY_REFUNDED');
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

    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        override
        onlyOpenQ
        nonReentrant
        returns (uint256)
    {
        uint256 claimedBalance;

        if (_tokenAddress == address(0)) {
            claimedBalance = address(this).balance;
            _transferProtocolToken(_payoutAddress, claimedBalance);
        } else {
            claimedBalance = getERC20Balance(_tokenAddress);
            _transferERC20(_tokenAddress, _payoutAddress, claimedBalance);
        }

        return claimedBalance;
    }

    function claimNft(address _payoutAddress, bytes32 depositId)
        external
        override
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(status == BountyStatus.OPEN, 'CLAIMING_CLOSED_BOUNTY');
        _transferNft(
            tokenAddress[depositId],
            _payoutAddress,
            tokenId[depositId]
        );

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
