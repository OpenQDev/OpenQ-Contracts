// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/DepositManagerStorage.sol';

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

        require(isWhitelisted(_tokenAddress), Errors.TOKEN_NOT_ACCEPTED);
        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

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
        uint256 depositVolume = bounty.volume(_depositId);
        uint256 tokenBalance = bounty.getTokenBalance(depToken);

        uint256 volume;
        if (depositVolume < tokenBalance) {
            volume = depositVolume;
        } else {
            volume = tokenBalance;
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

    /// @notice Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
