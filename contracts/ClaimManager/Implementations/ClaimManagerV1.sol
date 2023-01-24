// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/ClaimManagerStorage.sol';

/// @title ClaimManagerV1
/// @author FlacoJones
/// @notice Sole contract authorized to attempt claims on all bounty types
/// @dev Emitter of all claim-related events
/// @dev Some claim methods are onlyOracle protected, others have exclusively on-chain claim criteria
contract ClaimManagerV1 is ClaimManagerStorageV1 {
    constructor() {}

    /// @notice Initializes the ClaimManager implementation with oracle address
    /// @param _oracle The address of the oracle authorized to call onlyOracle methods (e.g. claimBounty)
    /// @dev Can only be called once thanks to initializer (https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializers)
    function initialize(address _oracle) external initializer onlyProxy {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Oraclize_init(_oracle);
    }

    /// @notice Calls appropriate claim method based on bounty type
    /// @param _bountyAddress The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    /// @dev see IAtomicBounty.close(_closerData) for _closerData ABI encoding schema
    function claimBounty(
        address _bountyAddress,
        address _closer,
        bytes calldata _closerData
    ) external onlyOracle onlyProxy {
        IBounty bounty = IBounty(payable(_bountyAddress));
        uint256 _bountyType = bounty.bountyType();

        // Decode to ensure data meets closerData schema before emitting any events
        abi.decode(_closerData, (address, string, address, string, uint256));

        if (_bountyType == OpenQDefinitions.ATOMIC) {
            require(
                bounty.status() == OpenQDefinitions.OPEN,
                Errors.CONTRACT_IS_NOT_CLAIMABLE
            );
            _claimAtomicBounty(bounty, _closer, _closerData);
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
            _claimOngoingBounty(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED) {
            _claimTieredPercentageBounty(bounty, _closer, _closerData);
        } else if (_bountyType == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixedBounty(bounty, _closer, _closerData);
        } else {
            revert(Errors.UNKNOWN_BOUNTY_TYPE);
        }

        emit ClaimSuccess(block.timestamp, _bountyType, _closerData, VERSION_1);
    }

    /// @notice Used for claimants who have:
    /// @notice A) Completed KYC with KYC DAO for their tier
    /// @notice B) Uploaded invoicing information for their tier
    /// @notice C) Uploaded any necessary financial forms for their tier
    /// @param _bountyAddress The payout address of the bounty
    /// @param _closerData ABI Encoded data associated with this claim
    function permissionedClaimTieredBounty(
        address _bountyAddress,
        bytes calldata _closerData
    ) external onlyProxy {
        IBounty bounty = IBounty(payable(_bountyAddress));

        (, , , , uint256 _tier) = abi.decode(
            _closerData,
            (address, string, address, string, uint256)
        );

        string memory closer = IOpenQ(openQ).addressToExternalUserId(
            msg.sender
        );

        require(hasKYC(msg.sender), Errors.ADDRESS_LACKS_KYC);

        require(
            keccak256(abi.encodePacked(closer)) !=
                keccak256(abi.encodePacked('')),
            Errors.NO_ASSOCIATED_ADDRESS
        );

        require(
            keccak256(abi.encode(closer)) ==
                keccak256(abi.encode(bounty.tierWinners(_tier))),
            Errors.CLAIMANT_NOT_TIER_WINNER
        );

        require(bounty.invoiceComplete(_tier), Errors.INVOICE_NOT_COMPLETE);

        require(
            bounty.supportingDocumentsComplete(_tier),
            Errors.SUPPORTING_DOCS_NOT_COMPLETE
        );

        if (bounty.bountyType() == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixedBounty(bounty, msg.sender, _closerData);
        } else if (bounty.bountyType() == OpenQDefinitions.TIERED) {
            _claimTieredPercentageBounty(bounty, msg.sender, _closerData);
        } else {
            revert(Errors.NOT_A_COMPETITION_CONTRACT);
        }

        emit ClaimSuccess(
            block.timestamp,
            bounty.bountyType(),
            _closerData,
            VERSION_1
        );
    }

    /// @notice Claim method for AtomicBounty
    /// @param bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    /// @dev See IAtomicBounty
    function _claimAtomicBounty(
        IBounty bounty,
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

    /// @notice Claim method for OngoingBounty
    /// @param bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    /// @dev see IBountyCore.claimOngoingPayout.(_closerData) for _closerData ABI encoding schema
    function _claimOngoingBounty(
        IBounty bounty,
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

    /// @notice Claim method for TieredPercentageBounty
    /// @param bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    function _claimTieredPercentageBounty(
        IBounty bounty,
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

    /// @notice Claim method for TieredFixedBounty
    /// @param bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    function _claimTieredFixedBounty(
        IBounty bounty,
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

    /// @notice Checks if bounty associated with _bountyId is open
    /// @return bool True if _bountyId is associated with an open bounty
    function bountyIsClaimable(address _bountyAddress)
        public
        view
        returns (bool)
    {
        IBounty bounty = IBounty(payable(_bountyAddress));

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

    /// @notice Override for UUPSUpgradeable._authorizeUpgrade(address newImplementation) to enforce onlyOwner upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @notice Exposes internal method Oraclize._transferOracle(address) restricted to onlyOwner called via proxy
    /// @param _newOracle The new oracle address
    function transferOracle(address _newOracle) external onlyProxy onlyOwner {
        require(_newOracle != address(0), Errors.NO_ZERO_ADDRESS);
        _transferOracle(_newOracle);
    }

    /// @notice Sets the OpenQProxy address used for checking IOpenQ(openQ).addressToExternalUserId
    function setOpenQ(address _openQ) external onlyProxy onlyOwner {
        openQ = _openQ;
    }

    /// @notice Sets the KYC DAO contract address
    /// @param _kyc The KYC DAO contract address
    function setKyc(address _kyc) external onlyProxy onlyOwner {
        kyc = IKycValidity(_kyc);
    }

    /// @notice Checks the current KYC DAO contract address (kyc)to see if user has a valid KYC NFT or not
    /// @return True if address is KYC with KYC DAO, false otherwise
    function hasKYC(address _address) public view returns (bool) {
        return kyc.hasValidToken(_address);
    }
}
