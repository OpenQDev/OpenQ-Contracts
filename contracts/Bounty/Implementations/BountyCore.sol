// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/BountyStorageCore.sol';

/// @title BountyCore
/// @author FlacoJones
/// @notice Shared methods common to all bounty types
/// @dev BountyCore -> BountyStorageCore -> Core Dependencies (OZ + Custom)
abstract contract BountyCore is BountyStorageCore {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    /// @notice Creates a deposit and transfers tokens from msg.sender to this contract
    /// @param _funder The funder's address
    /// @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
    /// @param _volume The volume of token to transfer
    /// @param _expiration The duration until the deposit becomes refundable
    /// @return (depositId, volumeReceived) Returns the deposit id and the amount transferred to bounty
    function receiveFunds(
        address _funder,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    )
        public
        payable
        virtual
        onlyDepositManager
        nonReentrant
        returns (bytes32, uint256)
    {
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        require(status == OpenQDefinitions.OPEN, Errors.CONTRACT_IS_CLOSED);

        bytes32 depositId = _generateDepositId();

        uint256 volumeReceived;
        if (_tokenAddress == address(0)) {
            require(msg.value != 0, Errors.ZERO_VOLUME_SENT);
            volumeReceived = msg.value;
        } else {
            if (msg.value != 0) {
                revert(Errors.ETHER_SENT);
            }
            volumeReceived = _receiveERC20(_tokenAddress, _funder, _volume);
        }
        require(volumeReceived != 0, Errors.ZERO_VOLUME_SENT);

        funder[depositId] = _funder;
        tokenAddress[depositId] = _tokenAddress;
        volume[depositId] = volumeReceived;
        depositTime[depositId] = block.timestamp;
        expiration[depositId] = _expiration;

        deposits.push(depositId);
        tokenAddresses.add(_tokenAddress);

        return (depositId, volumeReceived);
    }

    /// @notice Transfers volume of deposit from bounty to funder
    /// @param _depositId The deposit to refund
    /// @param _funder The initial funder of the deposit
    /// @param _volume The volume to be refunded
    function refundDeposit(
        bytes32 _depositId,
        address _funder,
        uint256 _volume
    ) external virtual onlyDepositManager nonReentrant {
        require(!refunded[_depositId], Errors.DEPOSIT_ALREADY_REFUNDED);
        require(funder[_depositId] == _funder, Errors.CALLER_NOT_FUNDER);
        require(
            block.timestamp >= depositTime[_depositId] + expiration[_depositId],
            Errors.PREMATURE_REFUND_REQUEST
        );

        refunded[_depositId] = true;

        if (tokenAddress[_depositId] == address(0)) {
            _transferProtocolToken(funder[_depositId], _volume);
        } else {
            _transferERC20(
                tokenAddress[_depositId],
                funder[_depositId],
                _volume
            );
        }
    }

    /// @notice Extends deposit duration
    /// @param _depositId The deposit to extend
    /// @param _seconds Number of seconds to extend deposit
    /// @param _funder The initial funder of the deposit
    function extendDeposit(
        bytes32 _depositId,
        uint256 _seconds,
        address _funder
    ) external virtual onlyDepositManager nonReentrant returns (uint256) {
        require(status == OpenQDefinitions.OPEN, Errors.CONTRACT_IS_CLOSED);
        require(!refunded[_depositId], Errors.DEPOSIT_ALREADY_REFUNDED);
        require(funder[_depositId] == _funder, Errors.CALLER_NOT_FUNDER);

        if (
            block.timestamp > depositTime[_depositId] + expiration[_depositId]
        ) {
            expiration[_depositId] =
                block.timestamp -
                depositTime[_depositId] +
                _seconds;
        } else {
            expiration[_depositId] = expiration[_depositId] + _seconds;
        }

        return expiration[_depositId];
    }

    /// @notice Sets the funding goal
    /// @param _fundingToken Token address for funding goal
    /// @param _fundingGoal Token volume for funding goal
    function setFundingGoal(address _fundingToken, uint256 _fundingGoal)
        external
        virtual
        onlyOpenQ
    {
        fundingGoal = _fundingGoal;
        fundingToken = _fundingToken;
        hasFundingGoal = true;
    }

    /// @notice Whether or not KYC is required to fund and claim the bounty
    /// @param _kycRequired Whether or not KYC is required to fund and claim the bounty
    function setKycRequired(bool _kycRequired) external virtual onlyOpenQ {
        kycRequired = _kycRequired;
    }

    /// @notice Whether or not the Bounty is invoiceRequired
    /// @param _invoiceRequired Whether or not the Bounty is invoiceRequired
    function setInvoiceRequired(bool _invoiceRequired)
        external
        virtual
        onlyOpenQ
    {
        invoiceRequired = _invoiceRequired;
    }

    /// @notice Whether or not KYC is required to fund and claim the bounty
    /// @param _supportingDocumentsRequired Whether or not KYC is required to fund and claim the bounty
    function setSupportingDocumentsRequired(bool _supportingDocumentsRequired)
        external
        virtual
        onlyOpenQ
    {
        supportingDocumentsRequired = _supportingDocumentsRequired;
    }

    /// @notice Transfers _volume of both ERC20 or protocol token to _payoutAddress
    /// @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
    /// @param _volume Volume to transfer
    /// @param _payoutAddress Destination address
    function _transferToken(
        address _tokenAddress,
        uint256 _volume,
        address _payoutAddress
    ) internal virtual {
        if (_tokenAddress == address(0)) {
            _transferProtocolToken(_payoutAddress, _volume);
        } else {
            _transferERC20(_tokenAddress, _payoutAddress, _volume);
        }
    }

    /// @notice Receives _volume of ERC20 at _tokenAddress from _funder to bounty address
    /// @param _tokenAddress The ERC20 token address
    /// @param _funder The funder of the bounty
    /// @param _volume The volume of token to transfer
    function _receiveERC20(
        address _tokenAddress,
        address _funder,
        uint256 _volume
    ) internal virtual returns (uint256) {
        uint256 balanceBefore = getERC20Balance(_tokenAddress);
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransferFrom(_funder, address(this), _volume);
        uint256 balanceAfter = getERC20Balance(_tokenAddress);
        require(
            balanceAfter >= balanceBefore,
            Errors.TOKEN_TRANSFER_IN_OVERFLOW
        );

        //// The reason we take the balanceBefore and balanceAfter rather than the raw volume
        /// is because certain ERC20 contracts ( e.g. USDT) take fees on transfers.
        /// Therefore the volume received after transferFrom can be lower than the raw volume sent by the sender
        return balanceAfter - balanceBefore;
    }

    /// @notice Transfers _volume of ERC20 at _tokenAddress from bounty address to _funder
    /// @param _tokenAddress The ERC20 token address
    /// @param _payoutAddress The destination address of the funds
    /// @param _volume The volume of token to transfer
    function _transferERC20(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _volume
    ) internal virtual {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        token.safeTransfer(_payoutAddress, _volume);
    }

    /// @notice Transfers _volume of protocol token from bounty address to _payoutAddress
    /// @param _payoutAddress The destination address of the funds
    /// @param _volume The volume of token to transfer
    function _transferProtocolToken(address _payoutAddress, uint256 _volume)
        internal
        virtual
    {
        payable(_payoutAddress).sendValue(_volume);
    }

    /// @notice Generates a unique deposit ID from bountyId and the current length of deposits
    function _generateDepositId() internal view virtual returns (bytes32) {
        return keccak256(abi.encode(bountyId, deposits.length));
    }

    /// TRANSFER HELPERS

    /// @notice Returns token balance for both ERC20 or protocol token
    /// @param _tokenAddress Address of an ERC20 or Zero Address for protocol token
    function getTokenBalance(address _tokenAddress)
        public
        view
        virtual
        returns (uint256)
    {
        if (_tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            return getERC20Balance(_tokenAddress);
        }
    }

    /// @notice Returns the ERC20 balance for this bounty address
    /// @param _tokenAddress The ERC20 token address
    /// @return balance The ERC20 balance for this bounty address
    function getERC20Balance(address _tokenAddress)
        public
        view
        virtual
        returns (uint256 balance)
    {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        return token.balanceOf(address(this));
    }

    /// @notice Returns an array of all deposits for this bounty
    /// @return deposits The array of deposits including ERC20 and protocol token
    function getDeposits() external view virtual returns (bytes32[] memory) {
        return deposits;
    }

    /// @notice Returns an array of all ERC20 token addresses which have funded this bounty
    /// @return tokenAddresses An array of all ERC20 token addresses which have funded this bounty
    function getTokenAddresses()
        public
        view
        virtual
        returns (address[] memory)
    {
        return tokenAddresses.values();
    }

    /// @notice Returns the total number of unique tokens deposited on the bounty
    /// @return tokenAddressesCount The length of the array of all ERC20 token addresses which have funded this bounty
    function getTokenAddressesCount() external view virtual returns (uint256) {
        return tokenAddresses.values().length;
    }
}
