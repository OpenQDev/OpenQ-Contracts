# OpenQ Audit 👨‍💻🥷👩‍💻

Hello! Thank you for hacking OpenQ.

Give it your all, pull no punches, and try your best to mess us up.

Here's everything you need to get started. Godspeed!

## Background

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

## About Us

OpenQ is a permissionless smart contract platform for minting, funding and claiming contracts.

## Contract Types

There are four types of contracts:

- `ATOMIC`: These are fixed-price, single contributor contracts
- `ONGOING`: These are fixed-price, multiple contributors can claim, all receiving the same amount
- `TIERED`: A crowdfundable, percentage based payout for each tier (1st, 2nd, 3rd)
- `TIERED_FIXED`: Competitions with fixed price payouts for each tier (1st, 2nd, 3rd)

## Architecture Overview

Upgradeability: 

`OpenQV3.sol`, `ClaimManagerV2.sol` and `DepositManagerV2.sol` are all [UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy). The implementation lies behind a proxy.

`BountyV2.sol` is also upgradeable, but because we have MANY deployed at any one time and want to be able to update them without calling `upgradeTo()` on each contract, we use the [Beacon Proxy pattern](https://docs.openzeppelin.com/contracts/3.x/api/proxy#beacon)