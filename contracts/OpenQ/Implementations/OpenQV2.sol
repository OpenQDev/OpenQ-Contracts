// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Custom imports
 */
import '../../Storage/OpenQStorage.sol';

/**
 * @title OpenQV1
 * @dev Main administrative contract for all bounty operations
 */
contract OpenQV2 is OpenQStorageV2 {
    /**
     * INITIALIZATION
     */

    constructor() {}

    /**
     * @dev Initializes the OpenQProxy storage with necessary storage variables like owner
     */
    function initialize() external initializer onlyProxy {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Mints a new bounty BeaconProxy using BountyFactory
     * @param _bountyId A unique string to identify a bounty
     * @param _organization The ID of the organization which owns the bounty
     * @param _initOperation Array of ABI encoded method calls passed to the bounty initializer
     * @return bountyAddress The address of the bounty minted
     */
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

    /**
     * @dev Sets bountyFactory address
     * @param _bountyFactory The BountyFactory address
     */
    function setBountyFactory(address _bountyFactory)
        external
        onlyProxy
        onlyOwner
    {
        bountyFactory = BountyFactory(_bountyFactory);
    }

    /**
     * @dev Sets bountyFactory address
     * @param _claimManager The ClaimManager address
     */
    function setClaimManager(address _claimManager)
        external
        onlyProxy
        onlyOwner
    {
        claimManager = _claimManager;
    }

    /**
     * @dev Sets bountyFactory address
     * @param _depositManager The DepositManager address
     */
    function setDepositManager(address _depositManager)
        external
        onlyProxy
        onlyOwner
    {
        depositManager = _depositManager;
    }

    /**
     * @dev Sets fundingGoal
     * @param _bountyId The id to update
     * @param _fundingGoalToken The id to update
     * @param _fundingGoalVolume The id to update
     */
    function setFundingGoal(
        string calldata _bountyId,
        address _fundingGoalToken,
        uint256 _fundingGoalVolume
    ) external onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setFundingGoal(_fundingGoalToken, _fundingGoalVolume);

        emit FundingGoalSet(
            bountyAddress,
            _fundingGoalToken,
            _fundingGoalVolume,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Sets payout token address and volume
     * @param _bountyId The id to update
     * @param _payoutToken The token address
     * @param _payoutVolume The token volume
     */
    function setPayout(
        string calldata _bountyId,
        address _payoutToken,
        uint256 _payoutVolume
    ) external onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayout(_payoutToken, _payoutVolume);

        emit PayoutSet(
            bountyAddress,
            _payoutToken,
            _payoutVolume,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Sets payout token address and volume
     * @param _bountyId The id to update
     * @param _payoutSchedule The token address
     */
    function setPayoutSchedule(
        string calldata _bountyId,
        uint256[] calldata _payoutSchedule
    ) external onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayoutSchedule(_payoutSchedule);

        emit PayoutScheduleSet(
            bountyAddress,
            address(0),
            _payoutSchedule,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    /**
     * @dev Sets payout token address and volume
     * @param _bountyId The id to update
     * @param _payoutSchedule The token address
     * @param _payoutTokenAddress The token volume
     */
    function setPayoutScheduleFixed(
        string calldata _bountyId,
        uint256[] calldata _payoutSchedule,
        address _payoutTokenAddress
    ) external onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        bounty.setPayoutScheduleFixed(_payoutSchedule, _payoutTokenAddress);

        emit PayoutScheduleSet(
            bountyAddress,
            _payoutTokenAddress,
            _payoutSchedule,
            bounty.bountyType(),
            new bytes(0),
            VERSION_1
        );
    }

    function closeOngoing(string calldata _bountyId) external {
        require(bountyIsOpen(_bountyId), Errors.CONTRACT_ALREADY_CLOSED);
        require(
            bountyType(_bountyId) == OpenQDefinitions.ONGOING,
            Errors.NOT_AN_ONGOING_CONTRACT
        );

        BountyV1 bounty = BountyV1(payable(bountyIdToAddress[_bountyId]));
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

    /**
     * UTILITY
     */

    /**
     * @dev Checks if bounty associated with _bountyId is open
     * @param _bountyId The token address in question
     * @return bool True if _bountyId is associated with an open bounty
     */
    function bountyIsOpen(string calldata _bountyId)
        public
        view
        returns (bool)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));
        bool isOpen = bounty.status() == OpenQDefinitions.OPEN;
        return isOpen;
    }

    /**
     * @dev Returns the bountyType of the bounty (Single, Ongoing, or Tiered)
     * @param _bountyId The token address in question
     * @return uint256 bountyType ()
     */
    function bountyType(string calldata _bountyId)
        public
        view
        returns (uint256)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));
        uint256 _bountyType = bounty.bountyType();
        return _bountyType;
    }

    /**
     * @dev Retrieves bountyId from a bounty's address
     * @param _bountyAddress The bounty address
     * @return string The bounty id associated with _bountyAddress
     */
    function bountyAddressToBountyId(address _bountyAddress)
        external
        view
        returns (string memory)
    {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));
        return bounty.bountyId();
    }

    function tierClaimed(string calldata _bountyId, uint256 _tier)
        external
        view
        returns (bool)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));
        bool _tierClaimed = bounty.tierClaimed(_tier);
        return _tierClaimed;
    }

    function solvent(string calldata _bountyId) external view returns (bool) {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        uint256 balance = bounty.getTokenBalance(bounty.payoutTokenAddress());
        return balance >= bounty.payoutVolume();
    }

    function ongoingClaimed(
        string calldata _bountyId,
        string calldata claimant,
        string calldata claimantAsset
    ) external view returns (bool) {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));
        bytes32 claimantId = keccak256(abi.encode(claimant, claimantAsset));
        bool _ongoingClaimed = bounty.claimantId(claimantId);
        return _ongoingClaimed;
    }

    /**
     * UPGRADES
     */

    /**
     * @dev Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev Override for ERC1967Upgrade._getImplementation() to expose implementation
     * @return address Implementation address associated with OpenQProxy
     */
    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    // VERSION 2
    function associateExternalIdToAddress(
        string calldata _externalUserId,
        address _associatedAddress
    ) external onlyOracle {
        externalUserIdToAddress[_externalUserId] = _associatedAddress;
        addresstoExternalUserId[_associatedAddress] = _externalUserId;
        emit ExternalUserIdAssociatedWithAddress(
            _externalUserId,
            _associatedAddress,
            new bytes(0),
            VERSION_2
        );
    }
}
