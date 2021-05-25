# Octobay Contracts

## Contracts

### Octobay.sol

This is the main contract that connects all the parts.
Many of the other contract's functions are only accessible through this main contract.

### UserAddressStorage.sol

Stores verified Ethereum addresses for GitHub users.

### OracleStorage.sol

Stores information about our Chainlink oracles and their available jobs.

### DepositStorage.sol

Stores funds for GitHub users and issues.

### OctobayGovernor.sol

Stores departments and deploys governance tokens.

### OctobayGovNFT.sol

An ERC721 contract, managing the transferable permissions in governance departments.

### OctobayGovToken.sol

The template contract for new governance tokens.

## Deploy Scripts

Which contracts are deployed and how depents on the target.
The LINK token and the Oracle contract are only deployed in development mode. LINK tokens are then automatically transferred to the main contract.

```bash
# Kovan testnet, using Infura and KOVAN_API_KEY env var
truffle migrate --network kovan

# Local node port 8545
truffle migrate --network development
```

When the main contract is deployed it connects itself with the other deployed contracts and overwrites old connections. If one contract was updated you just need to re-deploy this one and the main contract.

```bash
truffle migrate --network development --f <migration> --to <migration>

# Octobay
truffle migrate --network development --f 30 --to 30
```