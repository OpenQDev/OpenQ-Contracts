// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

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

    function initialize(address oracle) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(oracle);
        __ReentrancyGuard_init();
    }

    // Transactions
    function mintBounty(string calldata _id, string calldata _organization)
        external
        nonReentrant
        returns (address)
    {
        address bountyAddress = bountyFactory.mintBounty(
            _id,
            msg.sender,
            _organization,
            address(this)
        );

        emit BountyCreated(
            _id,
            _organization,
            msg.sender,
            bountyAddress,
            block.timestamp
        );

        return bountyAddress;
    }

    function fundBountyNFT(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration
    ) external nonReentrant returns (bool success) {
        Bounty bounty = Bounty(payable(_bountyAddress));

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'FUNDING_CLOSED_BOUNTY'
        );

        bytes32 depositId = bounty.receiveNft(
            msg.sender,
            _tokenAddress,
            _tokenId,
            _expiration
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
            _tokenId
        );

        return true;
    }

    function fundBountyToken(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _volume,
        uint256 _expiration
    ) external payable nonReentrant returns (bool success) {
        Bounty bounty = Bounty(payable(_bountyAddress));

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'FUNDING_CLOSED_BOUNTY'
        );

        (bytes32 depositId, uint256 volumeReceived) = bounty.receiveFunds{
            value: msg.value
        }(msg.sender, _tokenAddress, _volume, _expiration);

        emit TokenDepositReceived(
            depositId,
            _bountyAddress,
            bounty.bountyId(),
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

    function refundDeposit(address _bountyAddress, bytes32 _depositId)
        external
        nonReentrant
        returns (bool success)
    {
        Bounty bounty = Bounty(payable(_bountyAddress));

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'REFUNDING_CLOSED_BOUNTY'
        );

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
            bounty.bountyId(),
            _bountyAddress,
            bounty.organization(),
            block.timestamp
        );

        return true;
    }

    // Convenience Methods
    function bountyIsOpen(string memory _id) public view returns (bool) {
        address bountyAddress = bountyIdToAddress(_id);
        Bounty bounty = Bounty(payable(bountyAddress));
        bool isOpen = bounty.status() == Bounty.BountyStatus.OPEN;
        return isOpen;
    }

    function bountyIdToAddress(string memory _id)
        public
        view
        returns (address)
    {
        return bountyFactory.predictDeterministicAddress(_id);
    }

    function bountyAddressToBountyId(address bountyAddress)
        public
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

    // Revert any attempts to send ETH or unknown calldata
    fallback() external {
        revert();
    }
}
