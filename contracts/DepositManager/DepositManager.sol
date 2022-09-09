// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import './DepositManagerStorage.sol';

contract DepositManager is DepositManagerStorageV1 {
    /**
     * INITIALIZATION
     */

    constructor() {}

    /**
     * @dev Initializes the OpenQProxy storage with necessary storage variables like owner
     */
    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Sets openQTokenWhitelist address
     * @param _openQTokenWhitelist The OpenQTokenWhitelist address
     */
    function setTokenWhitelist(address _openQTokenWhitelist)
        external
        onlyOwner
        onlyProxy
    {
        openQTokenWhitelist = OpenQTokenWhitelist(_openQTokenWhitelist);
    }

    /**
     * @dev Transfers protocol token or ERC20 from msg.sender to bounty address
     * @param _bountyAddress A bounty address
     * @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
     * @param _volume The volume of token transferred
     * @param _expiration The duration until the deposit becomes refundable
     */
    function fundBountyToken(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable onlyProxy {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        if (!isWhitelisted(_tokenAddress)) {
            require(
                !tokenAddressLimitReached(_bountyAddress),
                Errors.TOO_MANY_TOKEN_ADDRESSES
            );
        }

        require(bountyIsOpen(_bountyAddress), Errors.CONTRACT_ALREADY_CLOSED);

        (bytes32 depositId, uint256 volumeReceived) = bounty.receiveFunds{
            value: msg.value
        }(msg.sender, _tokenAddress, _volume, _expiration);

        emit TokenDepositReceived(
            depositId,
            _bountyAddress,
            bounty.bountyId(),
            bounty.organization(),
            _tokenAddress,
            block.timestamp,
            msg.sender,
            _expiration,
            volumeReceived,
            0,
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Extends the expiration for a deposit
     * @param _bountyAddress Bounty address
     * @param _depositId The deposit to extend
     * @param _seconds The duration to add until the deposit becomes refundable
     */
    function extendDeposit(
        address _bountyAddress,
        bytes32 _depositId,
        uint256 _seconds
    ) external onlyProxy {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        require(
            bounty.funder(_depositId) == msg.sender,
            Errors.CALLER_NOT_FUNDER
        );

        uint256 newExpiration = bounty.extendDeposit(
            _depositId,
            _seconds,
            msg.sender
        );

        emit DepositExtended(
            _depositId,
            newExpiration,
            0,
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Transfers NFT from msg.sender to bounty address
     * @param _tokenAddress The ERC721 token address of the NFT
     * @param _tokenId The tokenId of the NFT to transfer
     * @param _expiration The duration until the deposit becomes refundable
     */
    function fundBountyNFT(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        uint256 _tier
    ) external onlyProxy {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        require(isWhitelisted(_tokenAddress), Errors.TOKEN_NOT_ACCEPTED);
        require(bountyIsOpen(_bountyAddress), Errors.CONTRACT_ALREADY_CLOSED);

        bytes32 depositId = bounty.receiveNft(
            msg.sender,
            _tokenAddress,
            _tokenId,
            _expiration,
            _tier
        );

        emit NFTDepositReceived(
            depositId,
            _bountyAddress,
            bounty.bountyId(),
            bounty.organization(),
            _tokenAddress,
            block.timestamp,
            msg.sender,
            _expiration,
            _tokenId,
            0,
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Refunds an individual deposit from bountyAddress to sender if expiration time has passed
     * @param _bountyAddress Bounty address
     * @param _depositId The depositId assocaited with the deposit being refunded
     */
    function refundDeposit(address _bountyAddress, bytes32 _depositId)
        external
        onlyProxy
    {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        require(
            bounty.funder(_depositId) == msg.sender,
            Errors.CALLER_NOT_FUNDER
        );

        require(
            block.timestamp >=
                bounty.depositTime(_depositId) + bounty.expiration(_depositId),
            Errors.PREMATURE_REFUND_REQUEST
        );
        
        address depToken = bounty.tokenAddress(_depositId);
        uint256 lockedFunds;
        bytes32[] memory depList = bounty.getDeposits();
        for (uint256 i = 0; i < depList.length; i++) {
            if(block.timestamp <
                bounty.depositTime(depList[i]) + bounty.expiration(depList[i])
                && bounty.tokenAddress(depList[i]) == depToken
                )
            { lockedFunds += bounty.volume(depList[i]); }   
        }

        uint256 availableFunds = bounty.getTokenBalance(depToken) - lockedFunds;
        
        uint256 volume;
        if (bounty.volume(_depositId) <= availableFunds ) {
            volume = bounty.volume(_depositId);
        } else {
            volume = availableFunds;
        }

        bounty.refundDeposit(_depositId, msg.sender, volume);

        emit DepositRefunded(
            _depositId,
            bounty.bountyId(),
            _bountyAddress,
            bounty.organization(),
            block.timestamp,
            bounty.tokenAddress(_depositId),
            volume,
            0,
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Checks if _tokenAddress is whitelisted
     * @param _tokenAddress The token address in question
     * @return bool True if _tokenAddress is whitelisted
     */
    function isWhitelisted(address _tokenAddress) public view returns (bool) {
        return openQTokenWhitelist.isWhitelisted(_tokenAddress);
    }

    /**
     * @dev Returns true if the total number of unique tokens deposited on then bounty is greater than the OpenQWhitelist TOKEN_ADDRESS_LIMIT
     * @param _bountyAddress Address of bounty
     * @return bool
     */
    function tokenAddressLimitReached(address _bountyAddress)
        public
        view
        returns (bool)
    {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        return
            bounty.getTokenAddressesCount() >=
            openQTokenWhitelist.TOKEN_ADDRESS_LIMIT();
    }

    /**
     * @dev Checks if bounty associated with _bountyId is open
     * @param _bountyAddress Address of bounty
     * @return bool True if _bountyId is associated with an open bounty
     */
    function bountyIsOpen(address _bountyAddress) public view returns (bool) {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));
        bool isOpen = bounty.status() == OpenQDefinitions.OPEN;
        return isOpen;
    }

    /**
     * @dev Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
