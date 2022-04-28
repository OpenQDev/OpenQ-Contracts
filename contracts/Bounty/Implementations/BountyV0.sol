// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '../../Storage/BountyStorage.sol';

contract BountyV0 is BountyStorageV0 {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Address for address payable;
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor() {}

    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ
    ) external initializer {
        require(bytes(_bountyId).length != 0, 'NO_EMPTY_BOUNTY_ID');
        require(bytes(_organization).length != 0, 'NO_EMPTY_ORGANIZATION');
        bountyId = _bountyId;
        issuer = _issuer;
        organization = _organization;
        bountyCreatedTime = block.timestamp;
        nftDepositLimit = 5;
        __ReentrancyGuard_init();
        __OpenQOnlyAccess_init(_openQ);
    }

    // Transactions
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable onlyOpenQ nonReentrant returns (bytes32, uint256) {
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
    ) external onlyOpenQ nonReentrant returns (bytes32) {
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
        onlyOpenQ
        nonReentrant
        returns (bool success)
    {
        require(status == 0, 'CLAIMING_CLOSED_BOUNTY');
        _transferNft(
            tokenAddress[depositId],
            _payoutAddress,
            tokenId[depositId]
        );

        return true;
    }

    function close(address _payoutAddress)
        external
        onlyOpenQ
        returns (bool success)
    {
        require(this.status() == 0, 'CLOSING_CLOSED_BOUNTY');
        status = 1;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        return true;
    }

    // Transfer Helpers
    function _receiveERC20(
        address _tokenAddress,
        address _funder,
        uint256 _volume
    ) internal returns (uint256) {
        uint256 balanceBefore = getERC20Balance(_tokenAddress);
        IERC20 token = IERC20(_tokenAddress);
        token.safeTransferFrom(_funder, address(this), _volume);
        uint256 balanceAfter = getERC20Balance(_tokenAddress);
        require(balanceAfter >= balanceBefore, 'TOKEN_TRANSFER_IN_OVERFLOW');

        /* The reason we take the balanceBefore and balanceAfter rather than the raw volume
           is because certain ERC20 contracts ( e.g. USDT) take fees on transfers.
					 Therefore the volume received after transferFrom can be lower than the raw volume sent by the sender */
        return balanceAfter.sub(balanceBefore);
    }

    function _transferERC20(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _volume
    ) internal {
        IERC20 token = IERC20(_tokenAddress);
        token.safeTransfer(_payoutAddress, _volume);
    }

    function _transferProtocolToken(address _payoutAddress, uint256 _volume)
        internal
    {
        payable(_payoutAddress).sendValue(_volume);
    }

    function _receiveNft(
        address _tokenAddress,
        address _sender,
        uint256 _tokenId
    ) internal {
        IERC721 nft = IERC721(_tokenAddress);
        nft.safeTransferFrom(_sender, address(this), _tokenId);
    }

    function _transferNft(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _tokenId
    ) internal {
        IERC721 nft = IERC721(_tokenAddress);
        nft.safeTransferFrom(address(this), _payoutAddress, _tokenId);
    }

    // View Methods
    function _generateDepositId() internal view returns (bytes32) {
        return keccak256(abi.encode(bountyId, deposits.length));
    }

    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        IERC20 token = IERC20(_tokenAddress);
        return token.balanceOf(address(this));
    }

    function getDeposits() external view returns (bytes32[] memory) {
        return deposits;
    }

    function getNftDeposits() external view returns (bytes32[] memory) {
        return nftDeposits;
    }

    function getTokenAddresses() public view returns (address[] memory) {
        return tokenAddresses.values();
    }

    // Revert any attempts to send unknown calldata
    fallback() external {
        revert();
    }

    receive() external payable {
        // React to receiving protocol token
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return
            bytes4(
                keccak256('onERC721Received(address,address,uint256,bytes)')
            );
    }
}
