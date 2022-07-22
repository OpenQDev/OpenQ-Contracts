// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

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
    using SafeMathUpgradeable for uint256;

    /**
     * INITIALIZATION
     */

    constructor() {}

    /**
     * @dev Initializes the OpenQProxy storage with necessary storage variables like oracle and owner
     * @param oracle The oracle address to be used for onlyOracle methods (e.g. claimBounty)
     */
    function initialize(address oracle) external initializer onlyProxy {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(oracle);
        __ReentrancyGuard_init();
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
     * @dev Sets openQTokenWhitelist address
     * @param _openQTokenWhitelist The OpenQTokenWhitelist address
     */
    function setTokenWhitelist(address _openQTokenWhitelist)
        external
        onlyProxy
        onlyOwner
    {
        openQTokenWhitelist = OpenQTokenWhitelist(_openQTokenWhitelist);
    }

    /**
     * @dev Exposes internal method Oraclize._transferOracle(address) restricted to onlyOwner called via proxy
     * @param _newOracle The new oracle address
     */
    function transferOracle(address _newOracle) external onlyProxy onlyOwner {
        require(
            _newOracle != address(0),
            'Oraclize: new oracle is the zero address'
        );
        _transferOracle(_newOracle);
    }

    /**
     * TRANSACTIONS
     */

    /**
     * @dev Mints a new bounty BeaconProxy using BountyFactory
     * @param _bountyId A unique string to identify a bounty
     * @param _organization The ID of the organization which owns the bounty
     * @param _initData Array of ABI encoded method calls passed to the bounty initializer
     * @return bountyAddress The address of the bounty minted
     */
    function mintBounty(
        string calldata _bountyId,
        string calldata _organization,
        OpenQDefinitions.Operation[] calldata _initData
    ) external nonReentrant onlyProxy returns (address) {
        require(
            bountyIdToAddress[_bountyId] == address(0),
            'BOUNTY_ALREADY_EXISTS'
        );
        address bountyAddress = bountyFactory.mintBounty(
            _bountyId,
            msg.sender,
            _organization,
            _initData
        );

        bountyIdToAddress[_bountyId] = bountyAddress;

        emit BountyCreated(
            _bountyId,
            _organization,
            msg.sender,
            bountyAddress,
            block.timestamp
        );

        return bountyAddress;
    }

    /**
     * @dev Transfers protocol token or ERC20 from msg.sender to bounty address
     * @param _bountyId A unique string to identify a bounty
     * @param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
     * @param _volume The volume of token transferred
     * @param _expiration The duration until the deposit becomes refundable
     */
    function fundBountyToken(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable nonReentrant onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        if (!isWhitelisted(_tokenAddress)) {
            require(
                !tokenAddressLimitReached(_bountyId),
                'TOO_MANY_TOKEN_ADDRESSES'
            );
        }

        require(bountyIsOpen(_bountyId), 'FUNDING_CLOSED_BOUNTY');

        (bytes32 depositId, uint256 volumeReceived) = bounty.receiveFunds{
            value: msg.value
        }(msg.sender, _tokenAddress, _volume, _expiration);

        emit TokenDepositReceived(
            depositId,
            bountyAddress,
            _bountyId,
            bounty.organization(),
            _tokenAddress,
            block.timestamp,
            msg.sender,
            _expiration,
            volumeReceived
        );
    }

    /**
     * @dev Extends the expiration for a deposit
     * @param _bountyId The bountyId
     * @param _depositId The deposit to extend
     * @param _seconds The duration to add until the deposit becomes refundable
     */
    function extendDeposit(
        string calldata _bountyId,
        bytes32 _depositId,
        uint256 _seconds
    ) external nonReentrant onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(bountyIsOpen(_bountyId) == true, 'EXTENDING_CLOSED_BOUNTY');

        require(
            bounty.funder(_depositId) == msg.sender,
            'ONLY_FUNDER_CAN_REQUEST_EXTENSION'
        );

        uint256 newExpiration = bounty.extendDeposit(
            _depositId,
            _seconds,
            msg.sender
        );

        emit DepositExtended(_depositId, newExpiration);
    }

    /**
     * @dev Transfers NFT from msg.sender to bounty address
     * @param _bountyId A unique string to identify a bounty
     * @param _tokenAddress The ERC721 token address of the NFT
     * @param _tokenId The tokenId of the NFT to transfer
     * @param _expiration The duration until the deposit becomes refundable
     */
    function fundBountyNFT(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) external nonReentrant onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(isWhitelisted(_tokenAddress), 'TOKEN_NOT_ACCEPTED');
        require(bountyIsOpen(_bountyId) == true, 'FUNDING_CLOSED_BOUNTY');

        bytes32 depositId = bounty.receiveNft(
            msg.sender,
            _tokenAddress,
            _tokenId,
            _expiration
        );

        emit NFTDepositReceived(
            depositId,
            bountyAddress,
            _bountyId,
            bounty.organization(),
            _tokenAddress,
            block.timestamp,
            msg.sender,
            _expiration,
            _tokenId
        );
    }

    /**
     * @dev Transfers full balance of bounty and any NFT deposits from bounty address to closer
     * @param _bountyId A unique string to identify a bounty
     * @param _closer The payout address of the bounty
     */
    function claimBounty(
        string calldata _bountyId,
        address _closer,
        string calldata _closerData
    ) external onlyOracle nonReentrant {
        require(bountyIsOpen(_bountyId) == true, 'CLAIMING_CLOSED_BOUNTY');

        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        if (bounty.ongoing()) {
            (address tokenAddress, uint256 volume) = bounty.claimOngoingPayout(
                _closer
            );

            emit TokenBalanceClaimed(
                bounty.bountyId(),
                bountyAddress,
                bounty.organization(),
                _closer,
                block.timestamp,
                tokenAddress,
                volume
            );

            return;
        }

        for (uint256 i = 0; i < bounty.getTokenAddresses().length; i++) {
            address tokenAddress = bounty.getTokenAddresses()[i];
            uint256 volume = bounty.claimBalance(_closer, tokenAddress);

            emit TokenBalanceClaimed(
                bounty.bountyId(),
                bountyAddress,
                bounty.organization(),
                _closer,
                block.timestamp,
                tokenAddress,
                volume
            );
        }

        for (uint256 i = 0; i < bounty.getNftDeposits().length; i++) {
            bounty.claimNft(_closer, bounty.nftDeposits(i));
        }

        bounty.close(_closer, _closerData);

        emit BountyClosed(
            _bountyId,
            bountyAddress,
            bounty.organization(),
            _closer,
            block.timestamp,
            _closerData
        );
    }

    /**
     * @dev Refunds an individual deposit from bountyAddress to sender if expiration time has passed
     * @param _depositId The depositId assocaited with the deposit being refunded
     * @param _bountyId A unique string to identify a bounty
     */
    function refundDeposit(string calldata _bountyId, bytes32 _depositId)
        external
        nonReentrant
        onlyProxy
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        require(bountyIsOpen(_bountyId) == true, 'REFUNDING_CLOSED_BOUNTY');

        require(
            bounty.funder(_depositId) == msg.sender,
            'ONLY_FUNDER_CAN_REQUEST_REFUND'
        );

        require(
            block.timestamp >=
                bounty.depositTime(_depositId).add(
                    bounty.expiration(_depositId)
                ),
            'PREMATURE_REFUND_REQUEST'
        );

        bounty.refundDeposit(_depositId, msg.sender);

        emit DepositRefunded(
            _depositId,
            _bountyId,
            bountyAddress,
            bounty.organization(),
            block.timestamp,
            bounty.tokenAddress(_depositId),
            bounty.volume(_depositId)
        );
    }

    /**
     * UTILITY
     */

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
     * @param _bountyId A unique string to identify a bounty
     * @return bool
     */
    function tokenAddressLimitReached(string calldata _bountyId)
        public
        view
        returns (bool)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV1 bounty = BountyV1(payable(bountyAddress));

        return
            bounty.getTokenAddressesCount() >=
            openQTokenWhitelist.TOKEN_ADDRESS_LIMIT();
    }

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
        bool isOpen = bounty.status() == 0;
        return isOpen;
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
