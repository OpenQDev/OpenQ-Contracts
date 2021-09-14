// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Issue.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Issue {
    string id;
    address owner;
    address tokenSymbolToAddressLibrary;

    constructor(string memory _id) {
        id = _id;
        owner = msg.sender;
    }

    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        ERC20 tokenAddress = ERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function transferAllAssets(address _payoutAddress) public {
        // HOW TO GET LIST OF TOKENS AND NFTS DEPOSITED ON THIS ISSUE

        // ORACLE Approach
        // Set up an oracle listening for IssueCreated event to get issueId
        // Oracle listens for transfers to issueAddress on all registered ERC20 contracts
        // Call oracle here to get list of token addresses

        // Benefits
        // Only process what you need
        // Scales well and is easily upgradable since its off chain
        // Also can be served to the FE
        // If backend goes down, can re-query from a blockchain indexing service like etherscan

        // Drawbacks
        // Requires stateful infrastructure maintenance
        // Gas cost for fulfill() call
        // Centralized

        // ~~~~~~~~~~~~~~~~~~~~~~~~

        // ON-CHAIN Approach
        // Create upgradable TokenAddress library to hold addresses
        // Loop over all and if balance is non-zero, transfer it

        // Benefits
        // No oracle to maintain
        // No gas for fulfill() call
        // Decentralized

        // Drawbacks
        // Doesn't scale well to arbitrary number of erc20/erc721
        // Much useless comparison checks
        // Need to do an on chain txn to update addresses

        address[] memory tokens;

        for (uint256 i; i < tokens.length; i++) {
            ERC20 tokenContract = ERC20(tokens[i]);
            tokenContract.transfer(
                _payoutAddress,
                tokenContract.balanceOf(address(this))
            );
        }
    }
}
