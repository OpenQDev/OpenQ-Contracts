// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import 'hardhat/console.sol';
import '../../Bounty/Bounty.sol';
import '../../Bounty/Implementations/BountyV0.sol';
import '../IOpenQ.sol';
import '../OpenQStorable.sol';
import '../../BountyFactory/BountyFactory.sol';
import '../../Oracle/Oraclize.sol';

// Upgradable
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';

// Utils
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

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
        public
        nonReentrant
        returns (address bountyAddress)
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

    function fundBounty(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _volume
    ) public nonReentrant returns (bool success) {
        BountyV0 bounty = BountyV0(_bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'FUNDING_CLOSED_BOUNTY'
        );

        (bytes32 depositId, uint256 volumeReceived) = bounty.receiveFunds(
            msg.sender,
            _tokenAddress,
            _volume
        );

        emit DepositReceived(
            bounty.bountyId(),
            bounty.organization(),
            _bountyAddress,
            _tokenAddress,
            msg.sender,
            volumeReceived,
            block.timestamp,
            depositId
        );

        return true;
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOracle
        nonReentrant
    {
        require(bountyIsOpen(_id) == true, 'CLAIMING_CLOSED_BOUNTY');

        address bountyAddress = bountyIdToAddress(_id);
        Bounty bounty = BountyV0(bountyAddress);

        for (uint256 i = 0; i < bounty.getBountyTokenAddresses().length; i++) {
            address tokenAddress = bounty.bountyTokenAddresses(i);
            uint256 volume = bounty.getERC20Balance(tokenAddress);

            bounty.claim(_payoutAddress, tokenAddress);

            emit BountyPaidout(
                bounty.bountyId(),
                bounty.organization(),
                bountyAddress,
                tokenAddress,
                _payoutAddress,
                volume,
                block.timestamp
            );
        }

        bounty.closeBounty(_payoutAddress);

        emit BountyClosed(
            _id,
            bounty.organization(),
            bountyAddress,
            _payoutAddress,
            block.timestamp
        );
    }

    function refundBountyDeposit(address _bountyAddress, bytes32 depositId)
        public
        nonReentrant
        returns (bool success)
    {
        Bounty bounty = BountyV0(_bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'REFUNDING_CLOSED_BOUNTY'
        );

        require(
            bounty.isAFunder(msg.sender) == true,
            'ONLY_FUNDERS_CAN_REQUEST_REFUND'
        );

        (
            bytes32 depositId,
            address funder,
            address tokenAddress,
            uint256 volume,
            uint256 depositTime,
            bool refunded
        ) = bounty.funderDeposits(msg.sender, depositId);

        require(
            block.timestamp >= depositTime.add(bounty.escrowPeriod()),
            'PREMATURE_REFUND_REQUEST'
        );

        bounty.refundBountyDeposit(msg.sender, depositId);

        emit DepositRefunded(
            bounty.bountyId(),
            bounty.organization(),
            _bountyAddress,
            tokenAddress,
            msg.sender,
            volume,
            block.timestamp,
            depositId
        );

        return true;
    }

    // Convenience Methods
    function bountyIsOpen(string memory _id) public view returns (bool) {
        address bountyAddress = bountyIdToAddress(_id);
        Bounty bounty = BountyV0(bountyAddress);
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
        BountyV0 bounty = BountyV0(bountyAddress);
        return bounty.bountyId();
    }

    // Upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    // Oracle
    function getOracle() external view returns (address) {
        return oracle();
    }

    // Revert any attempts to send ETH or unknown calldata
    fallback() external {
        revert();
    }
}
