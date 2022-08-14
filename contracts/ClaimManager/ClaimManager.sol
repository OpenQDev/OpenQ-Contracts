// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

/**
 * @dev Custom imports
 */
import '../OpenQ/IOpenQ.sol';
import '../Storage/OpenQStorage.sol';
import 'hardhat/console.sol';
import '../Library/OpenQDefinitions.sol';
import '../Oracle/Oraclize.sol';

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';

/**
 * @title OpenQV1
 * @dev Main administrative contract for all bounty operations
 */
contract ClaimManager is IOpenQ, Oraclize, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMathUpgradeable for uint256;

    uint256 public constant VERSION_1 = 1;

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
     * @dev Transfers full balance of bounty and any NFT deposits from bounty address to closer
     * @param _closer The payout address of the bounty
     */
    function claimBounty(
        address _bountyAddress,
        address _closer,
        bytes calldata _closerData
    ) external onlyOracle {
        require(bountyIsClaimable(_bountyAddress), 'BOUNTY_IS_NOT_CLAIMABLE');

        BountyV1 bounty = BountyV1(payable(_bountyAddress));
        uint256 _bountyType = bounty.bountyType();

        if (_bountyType == OpenQDefinitions.ONGOING) {
            _claimOngoing(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED) {
            _claimTiered(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixed(bounty, _closer, _closerData);
        } else {
            _claimSingle(bounty, _closer, _closerData);
        }

        emit ClaimSuccess(block.timestamp, _bountyType, _closerData, VERSION_1);
    }

    /**
     * TRANSACTIONS
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

        uint256 volume = bounty.claimTiered(
            _closer,
            _tier,
            bounty.payoutTokenAddress()
        );

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
            _bountyType == OpenQDefinitions.ONGOING
        ) {
            return status == 0;
        } else if (_bountyType == OpenQDefinitions.TIERED) {
            return status == 1;
        } else {
            revert('UNKNOWN_BOUNTY_STATUS');
        }
    }

    /**
     * @dev Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

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
}
