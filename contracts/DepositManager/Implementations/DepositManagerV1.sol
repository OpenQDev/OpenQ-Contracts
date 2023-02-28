// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/DepositManagerStorage.sol';
import 'hardhat/console.sol';

/// @title DepositManagerV1
/// @author FlacoJones
/// @notice Manager contract for depositing protocol, ERC-20, and ERC-721 on bounty contracts
/// @notice Emitter of all deposit-related events
contract DepositManagerV1 is DepositManagerStorageV1 {
    constructor() {}

    /// @notice Initializes the DepositManager implementation
    /// @notice Can only be called once thanks to initializer (https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializers)
    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /// @notice Sets openQTokenWhitelist address
    /// @param _openQTokenWhitelist The OpenQTokenWhitelist address
    function setTokenWhitelist(address _openQTokenWhitelist)
        external
        onlyOwner
        onlyProxy
    {
        openQTokenWhitelist = OpenQTokenWhitelist(_openQTokenWhitelist);
    }

    /// @notice Transfers protocol token or ERC20 from msg.sender to bounty address
    /// @param _bountyAddress A bounty address
    /// @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
    /// @param _volume The volume of token transferred
    /// @param _expiration The duration until the deposit becomes refundable
    /// @param funderUuid The external user id of the funder
    function fundBountyToken(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration,
        string memory funderUuid
    ) external payable onlyProxy {
        IBounty bounty = IBounty(payable(_bountyAddress));

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

        bytes memory funderUuidBytes = abi.encode(funderUuid);

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
            funderUuidBytes,
            VERSION_1
        );
    }

    /// @notice Extends the expiration for a deposit
    /// @param _bountyAddress Bounty address
    /// @param _depositId The deposit to extend
    /// @param _seconds The duration to add until the deposit becomes refundable
    function extendDeposit(
        address _bountyAddress,
        bytes32 _depositId,
        uint256 _seconds
    ) external onlyProxy {
        IBounty bounty = IBounty(payable(_bountyAddress));

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

    /// @notice Transfers NFT from msg.sender to bounty address
    /// @param _bountyAddress The address of the bounty to fund
    /// @param _tokenAddress The ERC721 token address of the NFT
    /// @param _tokenId The tokenId of the NFT to transfer
    /// @param _expiration The duration until the deposit becomes refundable
    /// @param _data The tier of the NFT (not relevant for non-tiered bounties)
    function fundBountyNFT(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata _data
    ) external onlyProxy {
        IBounty bounty = IBounty(payable(_bountyAddress));

        require(isWhitelisted(_tokenAddress), Errors.TOKEN_NOT_ACCEPTED);
        require(bountyIsOpen(_bountyAddress), Errors.CONTRACT_ALREADY_CLOSED);

        bytes32 depositId = bounty.receiveNft(
            msg.sender,
            _tokenAddress,
            _tokenId,
            _expiration,
            _data
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
            _data,
            VERSION_1
        );
    }

    /// @notice Refunds an individual deposit from bountyAddress to sender if expiration time has passed
    /// @param _bountyAddress The address of the bounty that has the deposit to refund
    /// @param _depositId The depositId associated with the deposit being refunded
    function refundDeposit(address _bountyAddress, bytes32 _depositId)
        external
        onlyProxy
    {
        IBounty bounty = IBounty(payable(_bountyAddress));

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

        uint256 availableFunds = bounty.getTokenBalance(depToken) -
            bounty.getLockedFunds(depToken);

        uint256 volume;
        if (bounty.volume(_depositId) <= availableFunds) {
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

    /// @notice Checks if _tokenAddress is whitelisted
    /// @param _tokenAddress The token address in question
    /// @return True if _tokenAddress is whitelisted, false otherwise
    function isWhitelisted(address _tokenAddress) public view returns (bool) {
        return openQTokenWhitelist.isWhitelisted(_tokenAddress);
    }

    /// @notice Returns true if the total number of unique tokens deposited on then bounty is greater than the OpenQWhitelist TOKEN_ADDRESS_LIMIT
    /// @param _bountyAddress Address of bounty
    /// @return True if the token address limit has been reached
    function tokenAddressLimitReached(address _bountyAddress)
        public
        view
        returns (bool)
    {
        IBounty bounty = IBounty(payable(_bountyAddress));

        return
            bounty.getTokenAddressesCount() >=
            openQTokenWhitelist.TOKEN_ADDRESS_LIMIT();
    }

    /// @notice Checks if bounty associated with _bountyId is open
    /// @param _bountyAddress Address of bounty
    /// @return bool True if _bountyId is associated with an open bounty
    function bountyIsOpen(address _bountyAddress) public view returns (bool) {
        IBounty bounty = IBounty(payable(_bountyAddress));
        bool isOpen = bounty.status() == OpenQDefinitions.OPEN;
        return isOpen;
    }

    /// @notice Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
