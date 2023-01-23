// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/TieredBountyStorageCore.sol';

abstract contract TieredBountyCore is TieredBountyStorageCore {
    /**
     * @dev Sets tierClaimed to true for the given tier
     * @param _tier The tier being claimed
     */
    function setTierClaimed(uint256 _tier) external onlyClaimManager {
        tierClaimed[_tier] = true;
    }

    function setTierWinner(string memory _winner, uint256 _tier)
        external
        onlyOpenQ
    {
        tierWinners[_tier] = _winner;
    }

    function getTierWinners() external view returns (string[] memory) {
        return tierWinners;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _data Whether or not KYC is required to fund and claim the bounty
     */
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        (uint256 _tier, bool _invoiceComplete) = abi.decode(
            _data,
            (uint256, bool)
        );
        invoiceComplete[_tier] = _invoiceComplete;
    }

    /**
     * @dev Whether or not KYC is required to fund and claim the bounty
     * @param _data Whether or not KYC is required to fund and claim the bounty
     */
    function setSupportingDocumentsComplete(bytes calldata _data)
        external
        onlyOpenQ
    {
        (uint256 _tier, bool _supportingDocumentsComplete) = abi.decode(
            _data,
            (uint256, bool)
        );
        supportingDocumentsComplete[_tier] = _supportingDocumentsComplete;
    }

    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata _data
    ) external override onlyDepositManager nonReentrant returns (bytes32) {
        require(
            nftDeposits.length < nftDepositLimit,
            Errors.NFT_DEPOSIT_LIMIT_REACHED
        );
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId();

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        uint256 _tier = abi.decode(_data, (uint256));
        tier[depositId] = _tier;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    /**
     * @dev Returns an array for the payoutSchedule
     * @return payoutSchedule An array containing the percentage to pay to [1st, 2nd, etc.] place
     */
    function getPayoutSchedule() external view returns (uint256[] memory) {
        return payoutSchedule;
    }
}
