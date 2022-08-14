// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Custom imports
 */
import '../IOpenQ.sol';
import '../../Storage/OpenQStorage.sol';
import 'hardhat/console.sol';
import '../../Library/OpenQDefinitions.sol';

/**
 * @title OpenQV1
 * @dev Main administrative contract for all bounty operations
 */
contract OpenQV1 is OpenQStorageV1, IOpenQ {
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
            'BOUNTY_ALREADY_EXISTS'
        );

        address bountyAddress = bountyFactory.mintBounty(
            _bountyId,
            msg.sender,
            _organization,
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

        require(msg.sender == bounty.issuer(), 'CALLER_NOT_ISSUER');

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
     * @dev Sets fundingGoal
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

        require(msg.sender == bounty.issuer(), 'CALLER_NOT_ISSUER');

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

    function closeCompetition(string calldata _bountyId) external {
        require(bountyIsOpen(_bountyId), 'COMPETITION_ALREADY_CLOSED');
        require(
            bountyType(_bountyId) == OpenQDefinitions.TIERED,
            'NOT_A_COMPETITION_BOUNTY'
        );

        BountyV1 bounty = BountyV1(payable(bountyIdToAddress[_bountyId]));
        require(msg.sender == bounty.issuer(), 'CLOSER_NOT_ISSUER');

        bounty.closeCompetition(msg.sender);

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

    function closeOngoing(string calldata _bountyId) external {
        require(bountyIsOpen(_bountyId), 'ONGOING_BOUNTY_ALREADY_CLOSED');
        require(
            bountyType(_bountyId) == OpenQDefinitions.ONGOING,
            'NOT_AN_ONGOING_BOUNTY'
        );

        BountyV1 bounty = BountyV1(payable(bountyIdToAddress[_bountyId]));
        require(msg.sender == bounty.issuer(), 'CLOSER_NOT_ISSUER');

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
}
