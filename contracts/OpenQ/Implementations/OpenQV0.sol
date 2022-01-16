// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import 'hardhat/console.sol';
import '../../Bounty/Bounty.sol';
import '../../Bounty/Implementations/BountyV0.sol';
import '../../Helpers/TransferHelper.sol';
import '../IOpenQ.sol';
import '../OpenQStorable.sol';
import '../../BountyFactory/BountyFactory.sol';

// Upgradable
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

contract OpenQV0 is OpenQStorable, IOpenQ, OwnableUpgradeable, UUPSUpgradeable {
    // Transactions
    function mintBounty(string calldata _id, string calldata _organization)
        public
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
    ) public returns (bool success) {
        BountyV0 bounty = BountyV0(_bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'Cannot fund a closed bounty'
        );

        uint256 volumeReceived = bounty.receiveFunds(
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
            block.timestamp
        );

        return true;
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOwner
    {
        require(
            bountyIsOpen(_id) == true,
            'Cannot claim a bounty that is already closed.'
        );

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

    function refundBountyDeposits(address _bountyAddress)
        public
        returns (bool success)
    {
        Bounty bounty = BountyV0(_bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'Cannot request refund on a closed bounty'
        );

        require(
            block.timestamp >=
                bounty.bountyCreatedTime() + bounty.escrowPeriod(),
            'Too early to withdraw funds'
        );

        require(
            bounty.isAFunder(msg.sender) == true,
            'Only funders of this bounty can reclaim funds after 30 days.'
        );

        for (
            uint256 i = 0;
            i < bounty.getFunderTokenAddresses(msg.sender).length;
            i++
        ) {
            address tokenAddress = bounty.funderTokenAddresses(msg.sender, i);
            uint256 volume = bounty.funderDeposits(msg.sender, tokenAddress);

            bounty.refundBountyDeposit(msg.sender, tokenAddress);

            emit DepositRefunded(
                bounty.bountyId(),
                bounty.organization(),
                _bountyAddress,
                tokenAddress,
                msg.sender,
                volume,
                block.timestamp
            );
        }

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
    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
