// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/OpenQStorage.sol';

/// @title OpenQV1
/// @author FlacoJones
/// @notice Main administrative contract for all bounty operations
/// @dev Do not add any new storage variables here. Put them in a OpenQStorageV# and release new implementation
contract OpenQV1 is OpenQStorageV1 {
    constructor() {}

    /// @notice Initializes the OpenQ implementation with necessary storage variables like owner
    function initialize() external initializer onlyProxy {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
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
    ) external nonReentrant onlyProxy returns (address) {
        require(
            bountyIdToAddress[_bountyId] == address(0),
            Errors.BOUNTY_ALREADY_EXISTS
        );

        address bountyAddress = bountyFactory.mintBounty(
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
    function setBountyFactory(address _bountyFactory)
        external
        onlyProxy
        onlyOwner
    {
        bountyFactory = BountyFactory(_bountyFactory);
    }

    /// @notice Sets ClaimManager proxy address
    /// @param _claimManager The ClaimManager address
    function setClaimManager(address _claimManager)
        external
        onlyProxy
        onlyOwner
    {
        claimManager = _claimManager;
    }

    /// @notice Sets DepositManager proxy address
    /// @param _depositManager The DepositManager address
    function setDepositManager(address _depositManager)
        external
        onlyProxy
        onlyOwner
    {
        depositManager = _depositManager;
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
    ) external {
        IBounty bounty = getBounty(_bountyId);
        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);
        bounty.setTierWinner(_winner, _tier);

        emit TierWinnerSelected(
            address(bounty),
            bounty.getTierWinners(),
            new bytes(0),
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
    function setKycRequired(string calldata _bountyId, bool _kycRequired)
        external
        onlyProxy
    {
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

    /// @notice Sets invoiceComplete on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _data ABI encoded data (A simple bool for AtomicContract, a (string, bool) of claimId for Ongoing, and a (uint256, bool) for TieredBounty to specify the tier it was completed for)
    function setInvoiceComplete(string calldata _bountyId, bytes calldata _data)
        external
        onlyProxy
    {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setInvoiceComplete(_data);

        emit InvoiceCompletedSet(
            address(bounty),
            bounty.bountyType(),
            abi.encode(bounty.getInvoiceComplete()),
            VERSION_1
        );
    }

    /// @notice Sets supportingDocumentsComplete on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _data ABI encoded data (A simple bool for AtomicContract, a (string, bool) of claimId for Ongoing, and a (uint256, bool) for TieredBounty to specify the tier it was completed for)
    function setSupportingDocumentsComplete(
        string calldata _bountyId,
        bytes calldata _data
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setSupportingDocumentsComplete(_data);

        emit SupportingDocumentsCompletedSet(
            address(bounty),
            bounty.bountyType(),
            abi.encode(bounty.getSupportingDocumentsComplete()),
            VERSION_1
        );
    }

    /// @notice Sets payout token address and volume on bounty with id _bountyId
    /// @param _bountyId The id to update
    /// @param _payoutToken The token address to be used for the payout
    /// @param _payoutVolume The volume of token to be used for the payout
    function setPayout(
        string calldata _bountyId,
        address _payoutToken,
        uint256 _payoutVolume
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayout(_payoutToken, _payoutVolume);

        emit PayoutSet(
            address(bounty),
            _payoutToken,
            _payoutVolume,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Sets payout volume array on percentage tiered bounty with id _bountyId
    /// @dev There is no tokenAddress needed here - payouts on percentage tiered bounties is a percentage of whatever is deposited on the contract
    /// @param _bountyId The bounty to update
    /// @param _payoutSchedule An array of payout volumes for each tier
    function setPayoutSchedule(
        string calldata _bountyId,
        uint256[] calldata _payoutSchedule
    ) external onlyProxy {
        IBounty bounty = getBounty(_bountyId);

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayoutSchedule(_payoutSchedule);

        emit PayoutScheduleSet(
            address(bounty),
            address(0),
            _payoutSchedule,
            bounty.bountyType(),
            new bytes(0),
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

    /// @notice Closes and ongoing bounty
    /// @param _bountyId The ongoing bounty to close
    function closeOngoing(string calldata _bountyId) external {
        require(bountyIsOpen(_bountyId), Errors.CONTRACT_ALREADY_CLOSED);
        require(
            bountyType(_bountyId) == OpenQDefinitions.ONGOING,
            Errors.NOT_AN_ONGOING_CONTRACT
        );

        IBounty bounty = IBounty(payable(bountyIdToAddress[_bountyId]));

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.closeOngoing(msg.sender);

        emit BountyClosed(
            _bountyId,
            bountyIdToAddress[_bountyId],
            bounty.organization(),
            address(0),
            block.timestamp,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /// @notice Checks if bounty associated with _bountyId is open
    /// @param _bountyId The bounty id
    /// @return True if _bountyId is associated with an open bounty, false otherwise
    function bountyIsOpen(string calldata _bountyId)
        public
        view
        returns (bool)
    {
        IBounty bounty = getBounty(_bountyId);
        bool isOpen = bounty.status() == OpenQDefinitions.OPEN;
        return isOpen;
    }

    /// @notice Returns the bountyType of the bounty (Single(0), Ongoing(1), Tiered(2), or Tiered Fixed(3))
    /// @param _bountyId The bounty id
    /// @return bountyType - See OpenQDefinitions.sol for values
    function bountyType(string calldata _bountyId)
        public
        view
        returns (uint256)
    {
        IBounty bounty = getBounty(_bountyId);
        uint256 _bountyType = bounty.bountyType();
        return _bountyType;
    }

    /// @notice Retrieves bountyId from a bounty's address
    /// @param _bountyAddress The bounty address
    /// @return string The bounty id associated with _bountyAddress
    function bountyAddressToBountyId(address _bountyAddress)
        external
        view
        returns (string memory)
    {
        IBounty bounty = IBounty(payable(_bountyAddress));
        return bounty.bountyId();
    }

    /// @notice Determines whether or not a tier is claimed on a percentage tiered or fixed tiered bounty
    /// @param _bountyId The bounty id
    /// @param _tier The tier to check
    /// @return True if claimed, false otherwise
    function tierClaimed(string calldata _bountyId, uint256 _tier)
        external
        view
        returns (bool)
    {
        IBounty bounty = getBounty(_bountyId);
        bool _tierClaimed = bounty.tierClaimed(_tier);
        return _tierClaimed;
    }

    /// @notice Determines whether or not an ongoing bounty or tiered bounty have enough funds to cover payouts
    /// @param _bountyId The bounty id
    /// @return True if solvent, false otherwise
    function solvent(string calldata _bountyId) external view returns (bool) {
        IBounty bounty = getBounty(_bountyId);

        uint256 balance = bounty.getTokenBalance(bounty.payoutTokenAddress());
        return balance >= bounty.payoutVolume();
    }

    /// @notice Returns an IBounty ABI wrapped arround given bounty address
    /// @param _bountyId The bounty id
    /// @return An IBounty upon which any methods in IBounty can be called
    function getBounty(string calldata _bountyId)
        internal
        view
        returns (IBounty)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        IBounty bounty = IBounty(bountyAddress);
        return bounty;
    }

    /// @notice Determines whether or not a given submission by claimant has already been used for a claim
    /// @param _bountyId The bounty id
    /// @param _claimant The external user id to check
    /// @param _claimantAsset The external id of the claimant's asset to check
    /// @return True if claimed, false otherwise
    function ongoingClaimed(
        string calldata _bountyId,
        string calldata _claimant,
        string calldata _claimantAsset
    ) external view returns (bool) {
        IBounty bounty = getBounty(_bountyId);
        bytes32 claimantId = keccak256(abi.encode(_claimant, _claimantAsset));
        bool _ongoingClaimed = bounty.claimantId(claimantId);
        return _ongoingClaimed;
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

    /// @notice Establishes a mapping between an external user id and an address
    /// @param _externalUserId The external user id (e.g. Github user id) to associate
    /// @param _associatedAddress The address to associate to _externalUserId
    function associateExternalIdToAddress(
        string calldata _externalUserId,
        address _associatedAddress
    ) external onlyOracle {
        externalUserIdToAddress[_externalUserId] = _associatedAddress;
        addressToExternalUserId[_associatedAddress] = _externalUserId;
        emit ExternalUserIdAssociatedWithAddress(
            _externalUserId,
            _associatedAddress,
            new bytes(0),
            VERSION_1
        );
    }
}
