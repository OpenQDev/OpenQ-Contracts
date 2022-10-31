// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import '../ClaimManagerStorage.sol';
import 'hardhat/console.sol';

/**
 * @title ClaimManager
 * @dev Contract with claim abilities on work contracts
 */
contract ClaimManagerV2 is ClaimManagerStorageV2 {
    /**
     * INITIALIZATION
     */

    constructor() {}

    /**
     * @dev Initializes the ClaimManager storage with necessary storage variables like oracle and owner
     * @param oracle The oracle address to be used for onlyOracle methods (e.g. claimBounty)
     */
    function initialize(address oracle) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(oracle);
    }

    /**
     * @dev Calls appropriate claim method based on bounty type
     * @param _bountyAddress The payout address of the bounty
     * @param _closer The payout address of the claimant
     * @param _closerData ABI Encoded data associated with this claim
     */
    function claimBounty(
        address _bountyAddress,
        address _closer,
        bytes calldata _closerData
    ) external onlyOracle onlyProxy {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));
        uint256 _bountyType = bounty.bountyType();

        if (_bountyType == OpenQDefinitions.ATOMIC) {
            require(
                bounty.status() == OpenQDefinitions.OPEN,
                Errors.CONTRACT_IS_NOT_CLAIMABLE
            );
            _claimSingle(bounty, _closer, _closerData);
            bounty.close(_closer, _closerData);

            emit BountyClosed(
                bounty.bountyId(),
                _bountyAddress,
                bounty.organization(),
                _closer,
                block.timestamp,
                bounty.bountyType(),
                _closerData,
                VERSION_1
            );
        } else if (_bountyType == OpenQDefinitions.ONGOING) {
            require(
                bounty.status() == OpenQDefinitions.OPEN,
                Errors.CONTRACT_IS_NOT_CLAIMABLE
            );
            _claimOngoing(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED) {
            _claimTiered(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixed(bounty, _closer, _closerData);
        } else {
            revert();
        }

        emit ClaimSuccess(block.timestamp, _bountyType, _closerData, VERSION_1);
    }

    /**
     * CLAIM HELPERS
     */

    function _claimSingle(
        BountyV1 bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        for (uint256 i = 0; i < bounty.getTokenAddresses().length; i++) {
            uint256 volume = bounty.claimBalance(
                _closer,
                bounty.getTokenAddresses()[i]
            );

            emit TokenBalanceClaimed(
                bounty.bountyId(),
                address(bounty),
                bounty.organization(),
                _closer,
                block.timestamp,
                bounty.getTokenAddresses()[i],
                volume,
                bounty.bountyType(),
                _closerData,
                VERSION_1
            );
        }

        for (uint256 i = 0; i < bounty.getNftDeposits().length; i++) {
            bounty.claimNft(_closer, bounty.nftDeposits(i));

            emit NFTClaimed(
                bounty.bountyId(),
                address(bounty),
                bounty.organization(),
                _closer,
                block.timestamp,
                bounty.tokenAddress(bounty.nftDeposits(i)),
                bounty.tokenId(bounty.nftDeposits(i)),
                bounty.bountyType(),
                _closerData,
                VERSION_1
            );
        }
    }

    function _claimOngoing(
        BountyV1 bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        (address tokenAddress, uint256 volume) = bounty.claimOngoingPayout(
            _closer,
            _closerData
        );

        emit TokenBalanceClaimed(
            bounty.bountyId(),
            address(bounty),
            bounty.organization(),
            _closer,
            block.timestamp,
            tokenAddress,
            volume,
            bounty.bountyType(),
            _closerData,
            VERSION_1
        );
    }

    function _claimTiered(
        BountyV1 bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        (, , , , uint256 _tier) = abi.decode(
            _closerData,
            (address, string, address, string, uint256)
        );

        require(!bounty.tierClaimed(_tier), Errors.TIER_ALREADY_CLAIMED);

        if (bounty.status() == 0) {
            bounty.closeCompetition();

            emit BountyClosed(
                bounty.bountyId(),
                address(bounty),
                bounty.organization(),
                address(0),
                block.timestamp,
                bounty.bountyType(),
                new bytes(0),
                VERSION_1
            );
        }

        for (uint256 i = 0; i < bounty.getTokenAddresses().length; i++) {
            uint256 volume = bounty.claimTiered(
                _closer,
                _tier,
                bounty.getTokenAddresses()[i]
            );

            emit TokenBalanceClaimed(
                bounty.bountyId(),
                address(bounty),
                bounty.organization(),
                _closer,
                block.timestamp,
                bounty.getTokenAddresses()[i],
                volume,
                bounty.bountyType(),
                _closerData,
                VERSION_1
            );
        }

        for (uint256 i = 0; i < bounty.getNftDeposits().length; i++) {
            bytes32 _depositId = bounty.nftDeposits(i);
            if (bounty.tier(_depositId) == _tier) {
                bounty.claimNft(_closer, _depositId);

                emit NFTClaimed(
                    bounty.bountyId(),
                    address(bounty),
                    bounty.organization(),
                    _closer,
                    block.timestamp,
                    bounty.tokenAddress(_depositId),
                    bounty.tokenId(_depositId),
                    bounty.bountyType(),
                    _closerData,
                    VERSION_1
                );
            }
        }

        bounty.setTierClaimed(_tier);
    }

    function _claimTieredFixed(
        BountyV1 bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        (, , , , uint256 _tier) = abi.decode(
            _closerData,
            (address, string, address, string, uint256)
        );

        require(!bounty.tierClaimed(_tier), Errors.TIER_ALREADY_CLAIMED);

        if (bounty.status() == 0) {
            bounty.closeCompetition();

            emit BountyClosed(
                bounty.bountyId(),
                address(bounty),
                bounty.organization(),
                address(0),
                block.timestamp,
                bounty.bountyType(),
                new bytes(0),
                VERSION_1
            );
        }

        uint256 volume = bounty.claimTieredFixed(_closer, _tier);

        emit TokenBalanceClaimed(
            bounty.bountyId(),
            address(bounty),
            bounty.organization(),
            _closer,
            block.timestamp,
            bounty.payoutTokenAddress(),
            volume,
            bounty.bountyType(),
            _closerData,
            VERSION_1
        );

        for (uint256 i = 0; i < bounty.getNftDeposits().length; i++) {
            bytes32 _depositId = bounty.nftDeposits(i);
            if (bounty.tier(_depositId) == _tier) {
                bounty.claimNft(_closer, _depositId);

                emit NFTClaimed(
                    bounty.bountyId(),
                    address(bounty),
                    bounty.organization(),
                    _closer,
                    block.timestamp,
                    bounty.tokenAddress(_depositId),
                    bounty.tokenId(_depositId),
                    bounty.bountyType(),
                    _closerData,
                    VERSION_1
                );
            }
        }

        bounty.setTierClaimed(_tier);
    }

    /**
     * UTILITY
     */

    /**
     * @dev Checks if bounty associated with _bountyId is open
     * @return bool True if _bountyId is associated with an open bounty
     */
    function bountyIsClaimable(address _bountyAddress)
        public
        view
        returns (bool)
    {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));

        uint256 status = bounty.status();
        uint256 _bountyType = bounty.bountyType();

        if (
            _bountyType == OpenQDefinitions.ATOMIC ||
            _bountyType == OpenQDefinitions.ONGOING ||
            _bountyType == OpenQDefinitions.TIERED ||
            _bountyType == OpenQDefinitions.TIERED_FIXED
        ) {
            return status == 0;
        } else {
            return status == 1;
        }
    }

    /**
     * ADMIN
     */

    /**
     * @dev Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev Exposes internal method Oraclize._transferOracle(address) restricted to onlyOwner called via proxy
     * @param _newOracle The new oracle address
     */
    function transferOracle(address _newOracle) external onlyProxy onlyOwner {
        require(_newOracle != address(0), Errors.NO_ZERO_ADDRESS);
        _transferOracle(_newOracle);
    }

    // VERSION 2
    function setOpenQ(address _openQ) external onlyOwner {
        openQ = _openQ;
    }

    /**
     * @dev Useful for competition minter to directly award a tier's prize to closer
     * @param _bountyAddress The payout address of the bounty
     * @param _externalUserId The Github ID of the winner
     * @param _closerData ABI Encoded data associated with this claim
     */
    function directClaimTieredBounty(
        address _bountyAddress,
        string calldata _externalUserId,
        bytes calldata _closerData
    ) external {
        BountyV1 bounty = BountyV1(payable(_bountyAddress));
        require(msg.sender == bounty.issuer(), Errors.CALLER_NOT_ISSUER);

        address closer = IOpenQV2(openQ).externalUserIdToAddress(
            _externalUserId
        );

        require(closer != address(0), Errors.NO_ASSOCIATED_ADDRESS);

        if (bounty.bountyType() == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixed(bounty, closer, _closerData);
        } else if (bounty.bountyType() == OpenQDefinitions.TIERED) {
            _claimTiered(bounty, closer, _closerData);
        } else {
            revert(Errors.NOT_A_COMPETITION_CONTRACT);
        }

        emit ClaimSuccess(
            block.timestamp,
            OpenQDefinitions.TIERED_FIXED,
            _closerData,
            VERSION_1
        );
    }
}
