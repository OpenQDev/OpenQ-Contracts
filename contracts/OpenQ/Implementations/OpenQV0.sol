// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol';

// Custom
import '../../Bounty/Bounty.sol';
import '../../BountyFactory/BountyFactory.sol';
import '../IOpenQ.sol';
import '../OpenQStorable.sol';
import '../../Oracle/Oraclize.sol';

contract OpenQV0 is
    OpenQStorable,
    IOpenQ,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    Oraclize
{
    using SafeMath for uint256;

    constructor() {}

    function initialize(address oracle) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(oracle);
        __ReentrancyGuard_init();
    }

    // Transactions
    function mintBounty(
        string calldata _bountyId,
        string calldata _organization
    ) external override nonReentrant onlyProxy returns (address) {
        address bountyAddress = bountyFactory.mintBounty(
            _bountyId,
            msg.sender,
            _organization,
            address(this)
        );

        emit BountyCreated(
            _bountyId,
            _organization,
            msg.sender,
            bountyAddress,
            block.timestamp
        );

        return bountyAddress;
    }

    function fundBountyNFT(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) external override nonReentrant onlyProxy returns (bool success) {
        address bountyAddress = bountyIdToAddress(_bountyId);
        Bounty bounty = Bounty(payable(bountyAddress));

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

        return true;
    }

    function fundBountyToken(
        string calldata _bountyId,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable override nonReentrant onlyProxy returns (bool success) {
        address bountyAddress = bountyIdToAddress(_bountyId);
        Bounty bounty = Bounty(payable(bountyAddress));

        require(bountyIsOpen(_bountyId) == true, 'FUNDING_CLOSED_BOUNTY');

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

        return true;
    }

    function claimBounty(string calldata _bountyId, address closer)
        external
        override
        onlyOracle
        nonReentrant
    {
        require(bountyIsOpen(_bountyId) == true, 'CLAIMING_CLOSED_BOUNTY');

        address bountyAddress = bountyIdToAddress(_bountyId);
        Bounty bounty = Bounty(payable(bountyAddress));

        for (uint256 i = 0; i < bounty.getDeposits().length; i++) {
            bytes32 depositId = bounty.deposits(i);

            if (!bounty.refunded(depositId)) {
                bounty.claim(closer, depositId);

                emit DepositClaimed(
                    depositId,
                    bounty.bountyId(),
                    bountyAddress,
                    bounty.organization(),
                    closer,
                    block.timestamp
                );
            } else {
                continue;
            }
        }

        bounty.close(closer);

        emit BountyClosed(
            _bountyId,
            bountyAddress,
            bounty.organization(),
            closer,
            block.timestamp
        );
    }

    function refundDeposit(string calldata _bountyId, bytes32 _depositId)
        external
        override
        nonReentrant
        onlyProxy
        returns (bool success)
    {
        address bountyAddress = bountyIdToAddress(_bountyId);
        Bounty bounty = Bounty(payable(bountyAddress));

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

        return true;
    }

    // Convenience Methods
    function bountyIsOpen(string calldata _bountyId)
        public
        view
        override
        returns (bool)
    {
        address bountyAddress = bountyIdToAddress(_bountyId);
        Bounty bounty = Bounty(payable(bountyAddress));
        bool isOpen = bounty.status() == Bounty.BountyStatus.OPEN;
        return isOpen;
    }

    function bountyIdToAddress(string calldata _bountyId)
        public
        view
        returns (address)
    {
        return bountyFactory.predictDeterministicAddress(_bountyId);
    }

    function bountyAddressToBountyId(address bountyAddress)
        external
        view
        returns (string memory)
    {
        Bounty bounty = Bounty(payable(bountyAddress));
        return bounty.bountyId();
    }

    // Upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    function setOpenQStorage(address _openQStorage)
        external
        onlyOwner
        onlyProxy
    {
        openQStorage = OpenQStorage(_openQStorage);
    }

    function setBountyFactory(address _bountyFactory)
        external
        onlyOwner
        onlyProxy
    {
        bountyFactory = BountyFactory(_bountyFactory);
    }

    // Revert any attempts to send ETH or unknown calldata
    fallback() external {
        revert();
    }
}
