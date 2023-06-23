// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/OpenQStorage.sol';
import '../../Library/ASCIIUtils.sol';

/// @title OpenQV1
/// @author FlacoJones
/// @notice Main administrative contract for all bounty operations
/// @dev Do not add any new storage variables here. Put them in a OpenQStorageV# and release new implementation
contract OpenQV1 is OpenQStorageV1 {
    using ASCIIUtils for string;

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the OpenQ implementation with necessary storage variables like owner
    function initialize(
        address _initialOracle,
        address _bountyFactory,
        address _depositManager,
        address _claimManager
    ) external initializer onlyProxy {
        __Ownable_init();
        __Oraclize_init(_initialOracle);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        bountyFactory = _bountyFactory;
        depositManager = _depositManager;
        claimManager = _claimManager;
    }

    function batchMintBounty(
        string[] calldata _bountyIds,
        string[] calldata _organizations,
        OpenQDefinitions.InitOperation[] memory _initOperations
    ) external onlyProxy {
        for (uint i = 0; i < _bountyIds.length; i++) {
            mintBounty(_bountyIds[i], _organizations[i], _initOperations[i]);
        }
    }

    /// @notice Mints a new bounty BeaconProxy using BountyFactory
    /// @param _bountyId A unique string to identify a bounty
    /// @param _organization The ID of the organization which owns the bounty
    /// @param _initOperation The ABI encoded data determining the type of bounty being initialized and associated data
    /// @dev see IBountyCore.initialize.(_operation) for _operation ABI encoding schema
    /// @return bountyAddress The address of the newly minted bounty
    function mintBounty(
        string calldata _bountyId,
        string calldata _organization,
        OpenQDefinitions.InitOperation memory _initOperation
    ) public nonReentrant onlyProxy returns (address) {
        require(
            bountyIdToAddress[_bountyId] == address(0),
            Errors.BOUNTY_ALREADY_EXISTS
        );

        require(_bountyId.isAscii(), Errors.INVALID_STRING);

        require(_organization.isAscii(), Errors.INVALID_STRING);

        address bountyAddress = BountyFactory(bountyFactory).mintBounty(
            _bountyId,
            msg.sender,
            _organization,
            claimManager,
            depositManager,
            _initOperation
        );

        bountyIdToAddress[_bountyId] = bountyAddress;

        emit BountyCreated(
            _bountyId,
            _organization,
            msg.sender,
            bountyAddress,
            block.timestamp,
            bountyType(_bountyId),
            _initOperation.data,
            VERSION_1
        );

        return bountyAddress;
    }

    /// @notice Sets the BountyFactory
    /// @param _bountyFactory The BountyFactory address
    function setBountyFactory(
        address _bountyFactory
    ) external onlyProxy onlyOwner {
        bountyFactory = _bountyFactory;
    }

    /// @notice Sets ClaimManager proxy address
    /// @param _claimManager The ClaimManager address
    function setClaimManager(
        address _claimManager
    ) external onlyProxy onlyOwner {
        claimManager = _claimManager;
    }

    /// @notice Sets DepositManager proxy address
    /// @param _depositManager The DepositManager address
    function setDepositManager(
        address _depositManager
    ) external onlyProxy onlyOwner {
        depositManager = _depositManager;
    }

    function batchSetTierWinner(
        string[] calldata _bountyIds,
        uint256[] calldata _tiers,
        string[] calldata _winners
    ) external nonReentrant onlyProxy {
        for (uint i = 0; i < _bountyIds.length; i++) {
            setTierWinner(_bountyIds[i], _tiers[i], _winners[i]);
        }
    }

    /// @notice Sets a winner for a particular tier
    /// @param _bountyId The bounty id
    /// @param _tier The tier they won
    /// @param _winner The external UUID (e.g. an OpenQ User UUID) that won this tier
    /// @dev Only callable by the bounty admin (AKA the minter of the bounty)
    function setTierWinner(
        string calldata _bountyId,
        uint256 _tier,
        string calldata _winner
    ) public {
        IBounty bounty = getBounty(_bountyId);
        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);
        bounty.setTierWinner(_winner, _tier);

        emit TierWinnerSelected(
            address(bounty),
            bounty.getTierWinners(),
            abi.encode(_bountyId, _winner, _tier),
            VERSION_1
        );
    }

    /// @notice Sets fundingGoal for bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _fundingGoalToken The token address to be used for the funding goal
    /// @param _fundingGoalVolume The volume of token to be used for the funding goal
    function setFundingGoal(
        string calldata _bountyId,
        address _fundingGoalToken,
        uint256 _fundingGoalVolume
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setFundingGoal(_fundingGoalToken, _fundingGoalVolume);

        emit FundingGoalSet(
            address(bounty),
            _fundingGoalToken,
            _fundingGoalVolume,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Sets kycRequired on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _kycRequired Whether or not KYC is required for a bounty
    function setKycRequired(
        string calldata _bountyId,
        bool _kycRequired
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setKycRequired(_kycRequired);

        emit KYCRequiredSet(
            address(bounty),
            _kycRequired,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Sets invoiceRequired on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _invoiceRequired Whether or not the bounty should be set as invoiceRequired
    function setInvoiceRequired(
        string calldata _bountyId,
        bool _invoiceRequired
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setInvoiceRequired(_invoiceRequired);

        emit InvoiceRequiredSet(
            address(bounty),
            _invoiceRequired,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Sets whether or not supporting documents will be required to claim a bounty
    /// @param _bountyId The id to update
    /// @param _supportingDocumentsRequired Whether or not supporting documents are required to claim this bounty
    function setSupportingDocumentsRequired(
        string calldata _bountyId,
        bool _supportingDocumentsRequired
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setSupportingDocumentsRequired(_supportingDocumentsRequired);

        emit SupportingDocumentsRequiredSet(
            address(bounty),
            _supportingDocumentsRequired,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    function batchSetInvoiceComplete(
        string[] calldata _bountyIds,
        bytes[] calldata _data
    ) external nonReentrant onlyProxy {
        for (uint i = 0; i < _bountyIds.length; i++) {
            setInvoiceComplete(_bountyIds[i], _data[i]);
        }
    }

    /// @notice Sets invoiceComplete on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _data ABI encoded data (A simple bool for AtomicContract, a (string, bool) of claimId for Ongoing, and a (uint256, bool) for TieredBounty to specify the tier it was completed for)
    function setInvoiceComplete(
        string calldata _bountyId,
        bytes calldata _data
    ) public onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(
            msg.sender == bounty.issuer() || msg.sender == _oracle,
            Errors.CALLER_NOT_ISSUER_OR_ORACLE
        );

        bounty.setInvoiceComplete(_data);

        emit InvoiceCompleteSet(
            address(bounty),
            bounty.bountyType(),
            _data,
            VERSION_1
        );
    }

    function batchSetSupportingDocumentsComplete(
        string[] calldata _bountyIds,
        bytes[] calldata _data
    ) external nonReentrant onlyProxy {
        for (uint i = 0; i < _bountyIds.length; i++) {
            setSupportingDocumentsComplete(_bountyIds[i], _data[i]);
        }
    }

    /// @notice Sets supportingDocumentsComplete on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _data ABI encoded data (A simple bool for AtomicContract, a (string, bool) of claimId for Ongoing, and a (uint256, bool) for TieredBounty to specify the tier it was completed for)
    function setSupportingDocumentsComplete(
        string calldata _bountyId,
        bytes calldata _data
    ) public onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(
            msg.sender == bounty.issuer() || msg.sender == _oracle,
            Errors.CALLER_NOT_ISSUER_OR_ORACLE
        );

        bounty.setSupportingDocumentsComplete(_data);

        (uint256 _tier, bool _supportingDocumentsComplete) = abi.decode(
            _data,
            (uint256, bool)
        );

        string memory _winner = bounty.getTierWinners()[_tier];

        emit SupportingDocumentsCompleteSet(
            address(bounty),
            bounty.bountyType(),
            abi.encode(_winner, _tier, _supportingDocumentsComplete),
            VERSION_1
        );
    }

    /// @notice Sets payout volume array on fixed tiered bounty with id _bountyId
    /// @param _bountyId The bounty to update
    /// @param _payoutSchedule An array of payout volumes for each tier
    /// @param _payoutTokenAddress The address of the token to be used for the payout
    function setPayoutScheduleFixed(
        string calldata _bountyId,
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayoutScheduleFixed(_payoutSchedule, _payoutTokenAddress);

        emit PayoutScheduleSet(
            address(bounty),
            _payoutTokenAddress,
            _payoutSchedule,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Checks if bounty associated with _bountyId is open
    /// @param _bountyId The bounty id
    /// @return True if _bountyId is associated with an open bounty, false otherwise
    function bountyIsOpen(
        string calldata _bountyId
    ) public view returns (bool) {
        IBounty bounty = getBounty(_bountyId);
        bool isOpen = bounty.status() == OpenQDefinitions.OPEN;
        return isOpen;
    }

    /// @notice Returns the bountyType of the bounty (Single(0), Ongoing(1), Tiered(2), or Tiered Fixed(3))
    /// @param _bountyId The bounty id
    /// @return bountyType - See OpenQDefinitions.sol for values
    function bountyType(
        string calldata _bountyId
    ) public view returns (uint256) {
        IBounty bounty = getBounty(_bountyId);
        uint256 _bountyType = bounty.bountyType();
        return _bountyType;
    }

    /// @notice Retrieves bountyId from a bounty's address
    /// @param _bountyAddress The bounty address
    /// @return string The bounty id associated with _bountyAddress
    function bountyAddressToBountyId(
        address _bountyAddress
    ) external view returns (string memory) {
        IBounty bounty = IBounty(payable(_bountyAddress));
        return bounty.bountyId();
    }

    /// @notice Determines whether or not a tier is claimed on a percentage tiered or fixed tiered bounty
    /// @param _bountyId The bounty id
    /// @param _tier The tier to check
    /// @return True if claimed, false otherwise
    function tierClaimed(
        string calldata _bountyId,
        uint256 _tier
    ) external view returns (bool) {
        IBounty bounty = getBounty(_bountyId);
        bool _tierClaimed = bounty.tierClaimed(_tier);
        return _tierClaimed;
    }

    /// @notice Returns an IBounty ABI wrapped arround given bounty address
    /// @param _bountyId The bounty id
    /// @return An IBounty upon which any methods in IBounty can be called
    function getBounty(
        string calldata _bountyId
    ) internal view returns (IBounty) {
        address bountyAddress = bountyIdToAddress[_bountyId];
        IBounty bounty = IBounty(bountyAddress);
        return bounty;
    }

    /// @notice Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @notice Override for ERC1967Upgrade._getImplementation() to expose implementation
    /// @return address Implementation address associated with OpenQProxy
    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /// @notice Exposes internal method Oraclize._transferOracle(address) restricted to onlyOwner called via proxy
    /// @param _newOracle The new oracle address
    function transferOracle(address _newOracle) external onlyProxy onlyOwner {
        require(_newOracle != address(0), Errors.NO_ZERO_ADDRESS);
        _transferOracle(_newOracle);
    }

    /// @notice Establishes a one-to-one mapping between an external user id and an address
    /// @param _externalUserId The external user id (e.g. Github user id) to associate
    /// @param _associatedAddress The address to associate to _externalUserId
    /// @dev It is important that this nulls out the previous addres<=>uuid association
    function associateExternalIdToAddress(
        string calldata _externalUserId,
        address _associatedAddress
    ) external onlyOracle {
        // Clear previous addres<=>off-chain identity associations
        string memory formerExternalUserId = addressToExternalUserId[
            _associatedAddress
        ];
        address formerAddress = externalUserIdToAddress[_externalUserId];

        externalUserIdToAddress[formerExternalUserId] = address(0);
        addressToExternalUserId[formerAddress] = '';

        externalUserIdToAddress[_externalUserId] = _associatedAddress;
        addressToExternalUserId[_associatedAddress] = _externalUserId;

        emit ExternalUserIdAssociatedWithAddress(
            _externalUserId,
            _associatedAddress,
            formerExternalUserId,
            formerAddress,
            new bytes(0),
            VERSION_1
        );
    }
}
