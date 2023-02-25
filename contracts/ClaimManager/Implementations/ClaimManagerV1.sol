// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/ClaimManagerStorage.sol';
import '../../Bounty/Interfaces/IAtomicBounty.sol';
import '../../Bounty/Interfaces/ITieredBounty.sol';

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

        if (_bountyType == OpenQDefinitions.ATOMIC) {
            // Decode to ensure data meets closerData schema before emitting any events
            abi.decode(_closerData, (address, string, address, string));

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

        if (bounty.bountyType() == OpenQDefinitions.TIERED_FIXED) {
            _claimTieredFixedBounty(bounty, msg.sender, _closerData);
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
    /// @param _bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    /// @dev See IAtomicBounty
    function _claimAtomicBounty(
        IAtomicBounty _bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        _eligibleToClaimAtomicBounty(_bounty, _closer);

        for (uint256 i = 0; i < _bounty.getTokenAddresses().length; i++) {
            uint256 volume = _bounty.claimBalance(
                _closer,
                _bounty.getTokenAddresses()[i]
            );

            emit TokenBalanceClaimed(
                _bounty.bountyId(),
                address(_bounty),
                _bounty.organization(),
                _closer,
                block.timestamp,
                _bounty.getTokenAddresses()[i],
                volume,
                _bounty.bountyType(),
                _closerData,
                VERSION_1
            );
        }
    }

    /// @notice Claim method for TieredFixedBounty
    /// @param _bounty The payout address of the bounty
    /// @param _closer The payout address of the claimant
    /// @param _closerData ABI Encoded data associated with this claim
    function _claimTieredFixedBounty(
        IBounty _bounty,
        address _closer,
        bytes calldata _closerData
    ) internal {
        (, , , , uint256 _tier) = abi.decode(
            _closerData,
            (address, string, address, string, uint256)
        );

        _eligibleToClaimTier(_bounty, _tier, _closer);

        if (_bounty.status() == 0) {
            _bounty.closeCompetition();

            emit BountyClosed(
                _bounty.bountyId(),
                address(_bounty),
                _bounty.organization(),
                address(0),
                block.timestamp,
                _bounty.bountyType(),
                new bytes(0),
                VERSION_1
            );
        }

        uint256 volume = _bounty.claimTieredFixed(_closer, _tier);

        emit TokenBalanceClaimed(
            _bounty.bountyId(),
            address(_bounty),
            _bounty.organization(),
            _closer,
            block.timestamp,
            _bounty.payoutTokenAddress(),
            volume,
            _bounty.bountyType(),
            _closerData,
            VERSION_1
        );
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

    /// @notice Runs all require statements to determine if the claimant can claim the specified tier on the tiered bounty
    function _eligibleToClaimTier(
        ITieredBounty _bounty,
        uint256 _tier,
        address _closer
    ) internal view {
        require(!_bounty.tierClaimed(_tier), Errors.TIER_ALREADY_CLAIMED);

        if (_bounty.invoiceRequired()) {
            require(
                _bounty.invoiceComplete(_tier),
                Errors.INVOICE_NOT_COMPLETE
            );
        }

        if (_bounty.supportingDocumentsRequired()) {
            require(
                _bounty.supportingDocumentsComplete(_tier),
                Errors.SUPPORTING_DOCS_NOT_COMPLETE
            );
        }

        if (_bounty.kycRequired()) {
            require(hasKYC(_closer), Errors.ADDRESS_LACKS_KYC);
        }
    }

    /// @notice Runs all require statements to determine if the claimant can claim the atomic bounty
    function _eligibleToClaimAtomicBounty(IAtomicBounty bounty, address _closer)
        internal
        view
    {
        require(
            bounty.status() == OpenQDefinitions.OPEN,
            Errors.CONTRACT_IS_NOT_CLAIMABLE
        );

        if (bounty.invoiceRequired()) {
            bool _invoiceComplete = abi.decode(
                bounty.getInvoiceComplete(),
                (bool)
            );
            require(_invoiceComplete, Errors.INVOICE_NOT_COMPLETE);
        }

        if (bounty.supportingDocumentsRequired()) {
            bool _supportingDocumentsComplete = abi.decode(
                bounty.getSupportingDocumentsComplete(),
                (bool)
            );
            require(
                _supportingDocumentsComplete,
                Errors.SUPPORTING_DOCS_NOT_COMPLETE
            );
        }

        if (bounty.kycRequired()) {
            require(hasKYC(_closer), Errors.ADDRESS_LACKS_KYC);
        }
    }
}
