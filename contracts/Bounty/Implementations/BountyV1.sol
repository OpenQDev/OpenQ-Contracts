// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

/**
 * @dev Custom imports
 */
import '../../Storage/BountyStorage.sol';
import '../../Library/OpenQDefinitions.sol';
import 'hardhat/console.sol';

/**
 * @title BountyV1
 * @dev Bounty Implementation Version 1
 */
contract BountyV1 is BountyStorageV1 {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address payable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    /**
     * INITIALIZATION
     */

    constructor() {}

    function _initSingle() internal {
        bountyType = 0;
    }

    function _initOngoingBounty(
        address _payoutTokenAddress,
        uint256 _payoutVolume
    ) internal {
        bountyType = 1;
        payoutTokenAddress = _payoutTokenAddress;
        payoutVolume = _payoutVolume;
    }

    function _initTiered(uint256[] memory _payoutSchedule) internal {
        bountyType = 2;
        uint256 sum;
        for (uint256 i = 0; i < _payoutSchedule.length; i++) {
            sum += _payoutSchedule[i];
        }
        require(sum == 100, 'Payout schedule must add up to 100');
        payoutSchedule = _payoutSchedule;
    }

    function _initSingleWithFundingGoal(
        address _fundingToken,
        uint256 _fundingGoal
    ) internal {
        bountyType = 3;
        setFundingGoal(_fundingToken, _fundingGoal);
    }

    function _initBytType(OpenQDefinitions.Operation memory operation)
        internal
    {
        uint32 operationType = operation.operationType;
        if (operationType == OpenQDefinitions.SINGLE) {
            _initSingle();
        } else if (operationType == OpenQDefinitions.ONGOING) {
            (address _payoutTokenAddress, uint256 _payoutVolume) = abi.decode(
                operation.data,
                (address, uint256)
            );
            _initOngoingBounty(_payoutTokenAddress, _payoutVolume);
        } else if (operationType == OpenQDefinitions.TIERED) {
            uint256[] memory _payoutSchedule = abi.decode(
                operation.data,
                (uint256[])
            );
            _initTiered(_payoutSchedule);
        } else if (operationType == OpenQDefinitions.FUNDING_GOAL) {
            (address _fundingToken, uint256 _fundingGoal) = abi.decode(
                operation.data,
                (address, uint256)
            );
            _initSingleWithFundingGoal(_fundingToken, _fundingGoal);
        } else {
            revert('OQ: unknown init operation type');
        }
    }

    /**
     * @dev Initializes a bounty proxy with initial state
     * @param _bountyId The unique bountyId
     * @param _issuer The sender of the mint bounty transaction
     * @param _organization The organization that owns the bounty
     * @param _openQ The OpenQProxy address
     */
    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ,
        OpenQDefinitions.Operation memory operation
    ) external initializer {
        require(bytes(_bountyId).length != 0, 'NO_EMPTY_BOUNTY_ID');
        require(bytes(_organization).length != 0, 'NO_EMPTY_ORGANIZATION');

        __ReentrancyGuard_init();
        __OnlyOpenQ_init(_openQ);

        bountyId = _bountyId;
        issuer = _issuer;
        organization = _organization;
        bountyCreatedTime = block.timestamp;
        nftDepositLimit = 5;

        _initBytType(operation);
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Creates a deposit and transfers tokens from msg.sender to self
     * @param _funder The funder address
     * @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
     * @param _volume The volume of token to transfer
     * @param _expiration The duration until the deposit becomes refundable
     * @return (depositId, volumeReceived) Returns the deposit id and the amount transferred to bounty
     */
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable onlyOpenQ nonReentrant returns (bytes32, uint256) {
        require(_volume != 0, 'ZERO_VOLUME_SENT');
        require(_expiration > 0, 'EXPIRATION_NOT_GREATER_THAN_ZERO');
        require(status == 0, 'BOUNTY_IS_CLOSED');
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

    /**
     * @dev Creates a deposit and transfers NFT from msg.sender to self
     * @param _sender The funder address
     * @param _tokenAddress The ERC721 token address of the NFT
     * @param _tokenId The tokenId of the NFT to transfer
     * @param _expiration The duration until the deposit becomes refundable
     * @return depositId
     */
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

    /**
     * @dev Transfers volume of deposit or NFT of deposit from bounty to funder
     * @param _depositId The deposit to refund
     * @param _funder The initial funder of the deposit
     */
    function refundDeposit(bytes32 _depositId, address _funder)
        external
        onlyOpenQ
        nonReentrant
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
    }

    /**
     * @dev Extends deposit duration
     * @param _depositId The deposit to extend
     * @param _seconds Number of seconds to extend deposit
     * @param _funder The initial funder of the deposit
     */
    function extendDeposit(
        bytes32 _depositId,
        uint256 _seconds,
        address _funder
    ) external onlyOpenQ nonReentrant returns (uint256) {
        require(status == 0, 'CLOSED_BOUNTY');
        require(refunded[_depositId] == false, 'DEPOSIT_ALREADY_REFUNDED');
        require(
            funder[_depositId] == _funder,
            'ONLY_FUNDER_CAN_REQUEST_EXTENSION'
        );

        expiration[_depositId] = expiration[_depositId] + _seconds;

        return expiration[_depositId];
    }

    /**
     * @dev Transfers full balance of _tokenAddress from bounty to _payoutAddress
     * @param _payoutAddress The destination address for the fund
     */
    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external onlyOpenQ nonReentrant returns (address, uint256) {
        (string memory claimant, string memory claimantAsset) = abi.decode(
            _closerData,
            (string, string)
        );

        bytes32 _claimantId = _generateClaimantId(claimant, claimantAsset);

        claimantId[_claimantId] = true;

        _transferToken(payoutTokenAddress, payoutVolume, _payoutAddress);
        return (payoutTokenAddress, payoutVolume);
    }

    function setTierClaimed(uint256 _tier) public onlyOpenQ {
        tierClaimed[_tier] = true;
    }

    /**
     * @dev Transfers full balance of _tokenAddress from bounty to _payoutAddress
     * @param _payoutAddress The destination address for the fund
     * @param _tier The ordinal of the claimant (e.g. 1st place, 2nd place)
     * @param _tokenAddress The token address being claimed
     */
    function claimTiered(
        address _payoutAddress,
        uint256 _tier,
        address _tokenAddress
    ) external onlyOpenQ nonReentrant returns (uint256) {
        require(
            status == OpenQDefinitions.COMPETITION_CLOSED,
            'COMPETITION_NOT_CLOSED'
        );
        require(!tierClaimed[_tier], 'TIER_ALREADY_CLAIMED');

        uint256 claimedBalance = (payoutSchedule[_tier] *
            fundingTotals[_tokenAddress]) / 100;

        _transferToken(_tokenAddress, claimedBalance, _payoutAddress);
        return claimedBalance;
    }

    /**
     * @dev Returns token balance for both ERC20 or protocol token
     * @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
     */
    function getTokenBalance(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        if (_tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            return getERC20Balance(_tokenAddress);
        }
    }

    /**
     * @dev Transfers _volume of both ERC20 or protocol token to _payoutAddress
     * @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
     * @param _volume Volume to transfer
     * @param _payoutAddress Destination address
     */
    function _transferToken(
        address _tokenAddress,
        uint256 _volume,
        address _payoutAddress
    ) internal {
        if (_tokenAddress == address(0)) {
            _transferProtocolToken(_payoutAddress, _volume);
        } else {
            _transferERC20(_tokenAddress, _payoutAddress, _volume);
        }
    }

    /**
     * @dev Transfers full balance of _tokenAddress from bounty to _payoutAddress
     * @param _tokenAddress ERC20 token address or Zero Address for protocol token
     * @param _payoutAddress The destination address for the fund
     */
    function claimBalance(address _payoutAddress, address _tokenAddress)
        external
        onlyOpenQ
        nonReentrant
        returns (uint256)
    {
        uint256 claimedBalance = getTokenBalance(_tokenAddress);
        _transferToken(_tokenAddress, claimedBalance, _payoutAddress);
        return claimedBalance;
    }

    /**
     * @dev Transfers NFT from bounty address to _payoutAddress
     * @param _payoutAddress The destination address for the NFT
     * @param _depositId The payout address of the bounty
     */
    function claimNft(address _payoutAddress, bytes32 _depositId)
        external
        onlyOpenQ
        nonReentrant
    {
        require(status == 0, 'CLAIMING_CLOSED_BOUNTY');
        _transferNft(
            tokenAddress[_depositId],
            _payoutAddress,
            tokenId[_depositId]
        );
    }

    /**
     * @dev Changes bounty status from 0 (OPEN) to 1 (CLOSED)
     * @param _payoutAddress The closer of the bounty
     */
    function close(address _payoutAddress, bytes calldata _closerData)
        external
        onlyOpenQ
    {
        require(status == 0, 'CLOSING_CLOSED_BOUNTY');
        status = 1;
        closer = _payoutAddress;
        bountyClosedTime = block.timestamp;
        closerData = _closerData;
    }

    /**
     * @dev Similar to close() for single priced bounties. closeCompetition() freezes the current funds for the competition.
     */
    function closeCompetition(address _closer) public {
        require(status == 0, 'COMPETITION_ALREADY_CLOSED');
        require(_closer == issuer, 'COMPETITION_CLOSER_NOT_ISSUER');

        status = OpenQDefinitions.COMPETITION_CLOSED;
        bountyClosedTime = block.timestamp;

        for (uint256 i = 0; i < getTokenAddresses().length; i++) {
            address _tokenAddress = getTokenAddresses()[i];
            fundingTotals[_tokenAddress] = getTokenBalance(_tokenAddress);
        }
    }

    /**
     * @dev Similar to close() for single priced bounties. closeOngoing()
     */
    function closeOngoing(address _closer) public {
        require(
            status == OpenQDefinitions.OPEN,
            'ONGOING_BOUNTY_ALREADY_CLOSED'
        );
        require(_closer == issuer, 'BOUNTY_CLOSER_NOT_ISSUER');

        status = OpenQDefinitions.ONGOING_CLOSED;
        bountyClosedTime = block.timestamp;
    }

    /**
     * TRANSFER HELPERS
     */

    /**
     * @dev Receives _volume of ERC20 at _tokenAddress from _funder to bounty address
     * @param _tokenAddress The ERC20 token address
     * @param _funder The funder of the bounty
     * @param _volume The volume of token to transfer
     */
    function _receiveERC20(
        address _tokenAddress,
        address _funder,
        uint256 _volume
    ) internal returns (uint256) {
        uint256 balanceBefore = getERC20Balance(_tokenAddress);
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransferFrom(_funder, address(this), _volume);
        uint256 balanceAfter = getERC20Balance(_tokenAddress);
        require(balanceAfter >= balanceBefore, 'TOKEN_TRANSFER_IN_OVERFLOW');

        /* The reason we take the balanceBefore and balanceAfter rather than the raw volume
         * is because certain ERC20 contracts ( e.g. USDT) take fees on transfers.
         * Therefore the volume received after transferFrom can be lower than the raw volume sent by the sender */
        return balanceAfter.sub(balanceBefore);
    }

    /**
     * @dev Transfers _volume of ERC20 at _tokenAddress from bounty address to _funder
     * @param _tokenAddress The ERC20 token address
     * @param _payoutAddress The destination address of the funds
     * @param _volume The volume of token to transfer
     */
    function _transferERC20(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _volume
    ) internal {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransfer(_payoutAddress, _volume);
    }

    /**
     * @dev Transfers _volume of protocol token from bounty address to _payoutAddress
     * @param _payoutAddress The destination address of the funds
     * @param _volume The volume of token to transfer
     */
    function _transferProtocolToken(address _payoutAddress, uint256 _volume)
        internal
    {
        payable(_payoutAddress).sendValue(_volume);
    }

    /**
     * @dev Receives NFT of _tokenId on _tokenAddress from _funder to bounty address
     * @param _tokenAddress The ERC721 token address
     * @param _sender The sender of the NFT
     * @param _tokenId The tokenId
     */
    function _receiveNft(
        address _tokenAddress,
        address _sender,
        uint256 _tokenId
    ) internal {
        IERC721Upgradeable nft = IERC721Upgradeable(_tokenAddress);
        nft.safeTransferFrom(_sender, address(this), _tokenId);
    }

    /**
     * @dev Transfers NFT of _tokenId on _tokenAddress from bounty address to _payoutAddress
     * @param _tokenAddress The ERC721 token address
     * @param _payoutAddress The sender of the NFT
     * @param _tokenId The tokenId
     */
    function _transferNft(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _tokenId
    ) internal {
        IERC721Upgradeable nft = IERC721Upgradeable(_tokenAddress);
        nft.safeTransferFrom(address(this), _payoutAddress, _tokenId);
    }

    /**
     * UTILITY
     */

    /**
     * @dev Generates a unique deposit ID from bountyId and the current length of deposits
     */
    function _generateDepositId() internal view returns (bytes32) {
        return keccak256(abi.encode(bountyId, deposits.length));
    }

    /**
     * @dev Generates a unique claimant ID from user and asset
     */
    function _generateClaimantId(
        string memory claimant,
        string memory claimantAsset
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(claimant, claimantAsset));
    }

    /**
     * @dev Returns the ERC20 balance for this bounty address
     * @param _tokenAddress The ERC20 token address
     * @return balance The ERC20 balance for this bounty address
     */
    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        return token.balanceOf(address(this));
    }

    /**
     * @dev Returns an array of all deposits (ERC20, protocol token, and NFT) for this bounty
     * @return deposits The array of deposits including ERC20, protocol token, and NFT
     */
    function getDeposits() external view returns (bytes32[] memory) {
        return deposits;
    }

    /**
     * @dev Returns an array of ONLY NFT deposits for this bounty
     * @return nftDeposits The array of NFT deposits
     */
    function getNftDeposits() external view returns (bytes32[] memory) {
        return nftDeposits;
    }

    /**
     * @dev Returns an array of all ERC20 token addresses which have funded this bounty
     * @return tokenAddresses An array of all ERC20 token addresses which have funded this bounty
     */
    function getTokenAddresses() public view returns (address[] memory) {
        return tokenAddresses.values();
    }

    /**
     * @dev Returns the total number of unique tokens deposited on the bounty
     * @return tokenAddressesCount The length of the array of all ERC20 token addresses which have funded this bounty
     */
    function getTokenAddressesCount() public view returns (uint256) {
        return tokenAddresses.values().length;
    }

    /**
     * @dev receive() method to accept protocol tokens
     */
    receive() external payable {}

    /**
     * @dev Override of IERC721ReceiverUpgradeable.onERC721Received(address,address,uint256,bytes) to enable receiving NFTs
     */
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

    /**
     * @dev Reverts any attempt to send unknown calldata
     */
    fallback() external {
        revert();
    }
}
