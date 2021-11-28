// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Bounty.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './TransferHelper.sol';

contract OpenQ is Ownable {
    // Properties
    mapping(string => address) public bountyIdToAddress;
    mapping(address => string) public bountyAddressToBountyId;

    // Events
    event BountyCreated(
        string bountyId,
        address issuerAddress,
        address bountyAddress,
        uint256 bountyMintTime
    );

    event BountyClosed(
        string bountyId,
        address bountyAddress,
        address payoutAddress,
        uint256 bountyClosedTime
    );

    event DepositReceived(
        string bountyId,
        address bountyAddress,
        address tokenAddress,
        address sender,
        uint256 value,
        uint256 receiveTime
    );

    event DepositRefunded(
        string bountyId,
        address bountyAddress,
        address tokenAddress,
        address sender,
        uint256 value,
        uint256 refundTime
    );

    event BountyPaidout(
        string bountyId,
        address bountyAddress,
        address tokenAddress,
        address payoutAddress,
        uint256 value,
        uint256 payoutTime
    );

    // Transactions
    function mintBounty(string calldata _id)
        public
        returns (address bountyAddress)
    {
        require(
            bountyIdToAddress[_id] == address(0),
            'Bounty already exists for given id. Find its address by calling bountyIdToAddress on this contract with the bountyId'
        );
        bountyAddress = address(new Bounty(_id, msg.sender));
        bountyIdToAddress[_id] = bountyAddress;
        bountyAddressToBountyId[bountyAddress] = _id;

        emit BountyCreated(_id, msg.sender, bountyAddress, block.timestamp);

        return bountyAddress;
    }

    function fundBounty(
        address _bountyAddress,
        address _tokenAddress,
        uint256 _value
    ) public returns (bool success) {
        Bounty bounty = Bounty(_bountyAddress);
        // require(bounty.address != 0, "Attempting to fund a bounty that does not exist.");
        bounty.receiveFunds(msg.sender, _tokenAddress, _value);
        emit DepositReceived(
            bounty.bountyId(),
            _bountyAddress,
            _tokenAddress,
            msg.sender,
            _value,
            block.timestamp
        );

        return true;
    }

    function claimBounty(string calldata _id, address _payoutAddress)
        public
        onlyOwner
    {
        address bountyAddress = bountyIdToAddress[_id];
        Bounty bounty = Bounty(bountyAddress);

        for (uint256 i = 0; i < bounty.getBountyTokenAddresses().length; i++) {
            address tokenAddress = bounty.bountyTokenAddresses(i);
            uint256 value = bounty.getERC20Balance(tokenAddress);

            bounty.claim(_payoutAddress, tokenAddress);

            emit BountyPaidout(
                bounty.bountyId(),
                bountyAddress,
                tokenAddress,
                _payoutAddress,
                value,
                block.timestamp
            );
        }

        bounty.closeBounty(_payoutAddress);
        emit BountyClosed(_id, bountyAddress, _payoutAddress, block.timestamp);
    }

    function refundBountyDeposits(address _bountyAddress)
        public
        returns (bool success)
    {
        Bounty bounty = Bounty(_bountyAddress);

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
            uint256 value = bounty.funderDeposits(msg.sender, tokenAddress);

            bounty.refundBountyDeposit(msg.sender, tokenAddress);

            emit DepositRefunded(
                bounty.bountyId(),
                _bountyAddress,
                tokenAddress,
                msg.sender,
                value,
                block.timestamp
            );
        }

        return true;
    }

    // Convenience Methods
    function bountyIsOpen(string calldata id_) public view returns (bool) {
        Bounty bounty = Bounty(this.bountyIdToAddress(id_));
        bool isOpen = bounty.status() == Bounty.BountyStatus.OPEN;
        return isOpen;
    }

    function getBountyAddress(string calldata _id)
        public
        view
        returns (address)
    {
        return bountyIdToAddress[_id];
    }
}
