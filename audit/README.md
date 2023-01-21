# OpenQ Audit 👨‍💻🥷👩‍💻

Hello! Thank you for hacking OpenQ.

Give it your all, pull no punches, and try your best to mess us up.

Here's everything you need to get started. Godspeed!

## About Us

OpenQ is a Github-integrated, crypto-native and all-around-automated marketplace for software engineers.

We specialize in providing tax-compliant, on-chain hackathon prize distributions.

## How People Use Us

You can read all about how OpenQ works from the user's perspective by reading our docs.

https://docs.openq.dev

## Technical Background

Blockchain: `Polygon Mainnet`

Language: `solidity 0.8.16`

## Scope

Includes:

- `All contracts in /contracts`

Excludes:

- `MockDai.sol`
- `MockLink.sol`
- `MockNft.sol`
- `TestToken.sol`

## Architecture Overview

### Upgradeability

#### UUPSUPgradeable

`OpenQV1.sol`, `ClaimManagerV1.sol` and `DepositManagerV1.sol` are all [UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy). 

The implementation lies behind a proxy.

#### Beacon Proxy

`BountyV1.sol` is also upgradeable, but because we have MANY deployed at any one time and want to be able to update them without calling `upgradeTo()` on each contract, we use the [Beacon Proxy pattern](https://docs.openzeppelin.com/contracts/3.x/api/proxy#beacon).

Each bounty contract lies behind a proxy.

## Developer Perspective on All OpenQ Flows: Minting, Funding and Claiming

## Contract Types

OpenQ supports FOUR types of contracts.

Each one differs in terms of:

- Number of claimants
- Fixed payout (e.g. 100 USDC), percentage payout (e.g. 1st place gets 50% of all escrowed funds), or whatever the full balances are on the bounty (funded with anything, full balance paid to claimant)

The names for those four types are:

- `ATOMIC`: These are fixed-price, single contributor contracts
- `ONGOING`: These are fixed-price, multiple contributors can claim, all receiving the same amount
- `TIERED`: A crowdfundable, percentage based payout for each tier (1st, 2nd, 3rd)
- `TIERED_FIXED`: Competitions with fixed price payouts for each tier (1st, 2nd, 3rd)

### Minting a Bounty

Minting a bounty begins at `OpenQ.mintBounty(bountyId, organizationId, initializationData)`.

Anyone can call this method to mint a bounty.

`OpenQV1.sol` then calls `bountyFactory.mintBounty(...)`.

The BountyFactory deploys a new `BeaconProxy`, pointing to the `beacon` address which will point each bounty to the proper implementation.

All the fun happens in the `InitOperation`. This is an ABI encoding of everything needed to initialize any of the four types of contracts.

The BountyV1.sol `initialization` method passes this `InitOperation` to `_initByType`, which then reads the type of bounty being minted, initializing the storage variables as needed.

### Funding a Bounty

### Claiming a Bounty

### Potential Exploits (free alpha!)

#### Directly sending tokens to the bounty address

Expect funding via contract

#### Git name spamming on tiered bounties