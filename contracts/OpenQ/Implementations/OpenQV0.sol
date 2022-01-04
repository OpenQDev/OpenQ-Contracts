// contracts/OpenQ.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../../Bounty/Bounty.sol';
import '../../Bounty/Implementations/BountyV0.sol';
import '../../Helpers/TransferHelper.sol';
import '../IOpenQ.sol';
import '../OpenQStorable.sol';

contract OpenQV0 is OpenQStorable, IOpenQ, Ownable {
    // Transactions
    function mintBounty(string calldata _id, string calldata _organization)
        public
        returns (address bountyAddress)
    {
        require(
            bountyIdToAddress(_id) == address(0),
            'Bounty already exists for given id. Find its address by calling bountyIdToAddress on this contract with the bountyId'
        );

        bountyAddress = address(new BountyV0(_id, msg.sender, _organization));
        setBountyIdToAddress(_id, bountyAddress);
        setBountyAddressToBountyId(bountyAddress, _id);

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
        require(
            bytes(bountyAddressToBountyId(_bountyAddress)).length != 0,
            'Attempting to fund a bounty that does not exist.'
        );

        Bounty bounty = BountyV0(_bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'Cannot fund a closed bounty'
        );

        bounty.receiveFunds(msg.sender, _tokenAddress, _volume);

        emit DepositReceived(
            bounty.bountyId(),
            bounty.organization(),
            _bountyAddress,
            _tokenAddress,
            msg.sender,
            _volume,
            block.timestamp
        );

        return true;
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOwner
    {
        address bountyAddress = bountyIdToAddress(_id);
        Bounty bounty = BountyV0(bountyAddress);

        require(
            bountyIsOpen(bounty.bountyId()) == true,
            'Cannot claim a bounty that is already closed.'
        );

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
    function bountyIsOpen(string memory id_) public view returns (bool) {
        Bounty bounty = BountyV0(bountyIdToAddress(id_));
        bool isOpen = bounty.status() == Bounty.BountyStatus.OPEN;
        return isOpen;
    }
}
