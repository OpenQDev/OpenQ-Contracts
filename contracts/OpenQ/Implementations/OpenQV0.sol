// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Part
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

// Custom
import '../../Bounty/Bounty.sol';
import '../../Bounty/Implementations/BountyV0.sol';
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

    function fundBounty(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _volume,
        bool _isNft,
        uint256 _tokenId
    ) external payable nonReentrant returns (bool success) {
        BountyV0 bounty = BountyV0(payable(_bountyAddress));

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'FUNDING_CLOSED_BOUNTY'
        );

        (
            bytes32 depositId,
            BountyV0.TokenStandard tokenStandard,
            uint256 volumeReceived
        ) = bounty.receiveFunds{value: msg.value}(
                msg.sender,
                _tokenAddress,
                _volume,
                _isNft,
                _tokenId
            );

        emit DepositReceived(
            bounty.bountyId(),
            bounty.organization(),
            _bountyAddress,
            _tokenAddress,
            msg.sender,
            volumeReceived,
            block.timestamp,
            depositId,
            tokenStandard,
            _tokenId
        );

        return true;
    }

    function claimBounty(string calldata _bountyId, address _payoutAddress)
        external
        onlyOracle
        nonReentrant
    {
        require(bountyIsOpen(_bountyId) == true, 'CLAIMING_CLOSED_BOUNTY');

        address bountyAddress = bountyIdToAddress(_bountyId);
        BountyV0 bounty = BountyV0(payable(bountyAddress));

        for (uint256 i = 0; i < bounty.getDeposits().length; i++) {
            (
                bytes32 depositId,
                ,
                address tokenAddress,
                uint256 volume,
                ,
                ,
                ,
                BountyV0.TokenStandard tokenStandard,
                ,
                uint256 tokenId
            ) = bounty.deposits(i);

            bounty.claim(_payoutAddress, depositId);

            emit DepositClaimed(
                bounty.bountyId(),
                bounty.organization(),
                bountyAddress,
                tokenAddress,
                _payoutAddress,
                volume,
                block.timestamp,
                tokenStandard,
                tokenId
            );
        }

        bounty.closeBounty(_payoutAddress);

        emit BountyClosed(
            _bountyId,
            bounty.organization(),
            bountyAddress,
            _payoutAddress,
            block.timestamp
        );
    }

    function refundBountyDeposit(address _bountyAddress, bytes32 _depositId)
        external
        nonReentrant
        returns (bool success)
    {
        BountyV0 bounty = BountyV0(payable(_bountyAddress));

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'REFUNDING_CLOSED_BOUNTY'
        );

        require(
            bounty.isAFunder(msg.sender) == true,
            'ONLY_FUNDERS_CAN_REQUEST_REFUND'
        );

        (
            ,
            ,
            address tokenAddress,
            uint256 volume,
            uint256 depositTime,
            ,
            ,
            ,
            ,

        ) = bounty.funderDeposits(msg.sender, _depositId);

        require(
            block.timestamp >= depositTime.add(bounty.escrowPeriod()),
            'PREMATURE_REFUND_REQUEST'
        );

        bounty.refundBountyDeposit(msg.sender, _depositId);

        emit DepositRefunded(
            bounty.bountyId(),
            bounty.organization(),
            _bountyAddress,
            tokenAddress,
            msg.sender,
            volume,
            block.timestamp,
            _depositId
        );

        return true;
    }

    // Convenience Methods
    function bountyIsOpen(string memory _id) public view returns (bool) {
        address bountyAddress = bountyIdToAddress(_id);
        BountyV0 bounty = BountyV0(payable(bountyAddress));
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
        BountyV0 bounty = BountyV0(payable(bountyAddress));
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
