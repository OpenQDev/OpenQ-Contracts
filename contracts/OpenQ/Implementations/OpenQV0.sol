// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Custom
import '../IOpenQ.sol';
import '../../Storage/OpenQStorage.sol';

contract OpenQV0 is OpenQStorageV0, IOpenQ {
    using SafeMathUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/
    constructor() {}

    /**
		Initializes the OpenQProxy storage with necessary storage variables like oracle and owner
		@param oracle The oracle address to be used for onlyOracle methods (e.g. claimBounty)
		 */
    function initialize(address oracle) external initializer onlyProxy {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(oracle);
        __ReentrancyGuard_init();
    }

    /**
		Sets bountyFactory address
		@param _bountyFactory The BountyFactory address
		 */
    function setBountyFactory(address _bountyFactory)
        external
        onlyProxy
        onlyOwner
    {
        bountyFactory = BountyFactory(_bountyFactory);
    }

    /**
		Sets openQTokenWhitelist address
		@param _openQTokenWhitelist The OpenQTokenWhitelist address
		 */
    function setTokenWhitelist(address _openQTokenWhitelist)
        external
        onlyProxy
        onlyOwner
    {
        openQTokenWhitelist = OpenQTokenWhitelist(_openQTokenWhitelist);
    }

    /**
		Exposes internal method Oraclize._transferOracle(address) restricted to onlyOwner called via proxy
		@param _newOracle The new oracle address
		 */
    function transferOracle(address _newOracle) external onlyProxy onlyOwner {
        require(
            _newOracle != address(0),
            'Oraclize: new oracle is the zero address'
        );
        _transferOracle(_newOracle);
    }

    /*///////////////////////////////////////////////////////////////
                          TRANSACTIONS
    //////////////////////////////////////////////////////////////*/

    /**
		Mints a new bounty BeaconProxy using BountyFactory
		@param _bountyId A unique string to identify a bounty
		@param _organization The ID of the organization which owns the bounty
		@return bountyAddress The address of the bounty minted
		 */
    function mintBounty(
        string calldata _bountyId,
        string calldata _organization
    ) external nonReentrant onlyProxy returns (address) {
        require(
            bountyIdToAddress[_bountyId] == address(0),
            'BOUNTY_ALREADY_EXISTS'
        );
        address bountyAddress = bountyFactory.mintBounty(
            _bountyId,
            msg.sender,
            _organization
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
		Transfers protocol token or ERC20 from msg.sender to bounty address
		@param _bountyId A unique string to identify a bounty
		@param _tokenAddress The ERC20 token address (ZeroAddress if funding with protocol token)
		@param _volume The volume of token transferred
		@param _expiration The duration until the deposit becomes refundable
		 */
    function fundBountyToken(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable nonReentrant onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV0 bounty = BountyV0(payable(bountyAddress));

        require(isWhitelisted(_tokenAddress), 'TOKEN_NOT_ACCEPTED');
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
		Transfers NFT from msg.sender to bounty address
		@param _bountyId A unique string to identify a bounty
		@param _tokenAddress The ERC721 token address of the NFT
		@param _tokenId The tokenId of the NFT to transfer
		@param _expiration The duration until the deposit becomes refundable
		 */
    function fundBountyNFT(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) external nonReentrant onlyProxy {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV0 bounty = BountyV0(payable(bountyAddress));

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
		Transfers full balance of bounty and any NFT deposits from bounty address to closer
		@param _bountyId A unique string to identify a bounty
		@param _closer The payout address of the bounty
		 */
    function claimBounty(string calldata _bountyId, address _closer)
        external
        onlyOracle
        nonReentrant
    {
        require(bountyIsOpen(_bountyId) == true, 'CLAIMING_CLOSED_BOUNTY');

        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV0 bounty = BountyV0(payable(bountyAddress));

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

        bounty.close(_closer);

        emit BountyClosed(
            _bountyId,
            bountyAddress,
            bounty.organization(),
            _closer,
            block.timestamp
        );
    }

    /**
		Refunds an individual deposit from bountyAddress to sender if expiration time has passed
		@param _bountyId A unique string to identify a bounty
		@param _depositId The depositId assocaited with the deposit being refunded
		 */
    function refundDeposit(string calldata _bountyId, bytes32 _depositId)
        external
        nonReentrant
        onlyProxy
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV0 bounty = BountyV0(payable(bountyAddress));

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
            block.timestamp
        );
    }

    /*///////////////////////////////////////////////////////////////
													UTILITY
    //////////////////////////////////////////////////////////////*/

    /**
		Checks if _tokenAddress is whitelisted
		@param _tokenAddress The token address in question
		@return bool True if _tokenAddress is whitelisted
		 */
    function isWhitelisted(address _tokenAddress) public view returns (bool) {
        return openQTokenWhitelist.isWhitelisted(_tokenAddress);
    }

    /**
		Checks if bounty associated with _bountyId is open
		@param _bountyId The token address in question
		@return bool True if _bountyId is associated with an open bounty
		 */
    function bountyIsOpen(string calldata _bountyId)
        public
        view
        returns (bool)
    {
        address bountyAddress = bountyIdToAddress[_bountyId];
        BountyV0 bounty = BountyV0(payable(bountyAddress));
        bool isOpen = bounty.status() == 0;
        return isOpen;
    }

    /**
		Retrieves bountyId from a bounty's address
		@param _bountyAddress The bounty address
		@return string The bounty id associated with _bountyAddress
		 */
    function bountyAddressToBountyId(address _bountyAddress)
        external
        view
        returns (string memory)
    {
        BountyV0 bounty = BountyV0(payable(_bountyAddress));
        return bounty.bountyId();
    }

    /*///////////////////////////////////////////////////////////////
													UPGRADES
    //////////////////////////////////////////////////////////////*/

    /**
		Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
		 */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
		Override for ERC1967Upgrade._getImplementation() to expose implementation
		@return address Implementation address associated with OpenQProxy
		 */
    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
