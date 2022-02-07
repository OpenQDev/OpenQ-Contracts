# OpenQ Smart Contracts 

Welcome! By luck or misfortune you've found yourself in the OpenQ on-chain universe. Let's get you started.

## Core User Actions

OpenQ revolves around five core user actions.

Each action corresponds to one Solidity Event. These events are declared in [IOpenQ](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/IOpenQ.sol). 

Each event emitted is indexed by [The Graph](https://thegraph.com/en/) to aggregate information on bounty minting, funding, refunding and claims.

We will cover how we handle each of these five core actions on-chain in brief below.

The in the [Contracts](https://github.com/OpenQDev/OpenQ-Contracts#contracts) section, we will then cover the specifics in code of how our smart contracts enable these actions.

### Mint Bounty

Minting a bounty corresponds to deploying a new [ERC-1167 Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167) with [BountyV0.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Implementations/BountyV0.sol) as its hardcoded implementation.

This initializes such state variable like `bountyId`, `escrowPeriod`, `issuer`, `organization`.

### Fund Bounty

Funding a bounty means approving the bounty address to call `transferFrom` on an ERC-20 contract, followed by an internal accounting system on the BountyV0 contract itself.

### Refund Bounty

Refunding a bounty is allowed after an escrow period has been reached, as reflected by `block.timestamp`.

### Claim Bounty

Claiming a bounty triggers an ERC-20 `transfer` of the funds deposited on that bounty contract address to to the `payoutAddress` passed to claim.

The `claimBounty` method is only callable by the OpenQ Oracle.

### Closed Bounty

Closing a bounty simply sets bounty status to `CLOSED` and the `bountyClosedTime` to `block.timestamp`.

## Contracts

The five core OpenQ actions defined above are composed across five contracts.

- OpenQV0 (Proxy) Deployed automatically by the [hardhat-upgrades](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades) plugin. It is an ERC-1967 [UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) contract.
- [OpenQV0 (Implementation)](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/Implementations/OpenQV0.sol)
- [BountyV0.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Implementations/BountyV0.sol)
- [BountyFactory.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/BountyFactory/BountyFactory.sol)
- [OpenQStorage.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Storage/OpenQStorage.sol)

We will cover each of those five contracts below.

### [BountyV0.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Implementations/BountyV0.sol)

Each BountyV0 contract represent one bounty linked to one GitHub Issue. 

The `bountyId` is the [Global Node Id](https://docs.github.com/en/graphql/guides/using-global-node-ids) of the issue linked to that bounty.

The one-to-one link between a bounty, a GitHub issue and a smart contract enables OpenQ to offboard much of the deposit accounting to the tried and true ERC-20 standard.

Any exploit against a BountyV0 contract could acquire at most all of the deposits on that one issue. The core contract OpenQV0 holds no deposits.

This flexiibility allows us to accept any ERC-20, and in the future ERC-721, as bounty.

Since only the [runtime bytecode](https://medium.com/authereum/bytecode-and-init-code-and-runtime-code-oh-my-7bcd89065904) is available, which does not include the constructor the BountyV0 implementation only has an [initialize](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Bounty.sol#L50) method.

The initialize method is protected from being called mutiple times by [OpenZeppelin's Initializable](https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/master/packages/core/contracts/Initializable.sol) interface.

#### onlyOpenQ

To prevent any calls which may trigger bounty state transitions without emitting an indexable event in the core OpenQ contract, we protect all methods on BountyV0 with the `onlyOpenQ` modifier defined in [Bounty.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Bounty.sol#L68), an abstract contract inhereited by BountyV0.

### [BountyFactory.sol](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/BountyFactory/BountyFactory.sol)

The BountyFactory is responsible for minting new bounties using the [ERC-1167 Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167) pattern to mint new bounties using the least gas possible.

The implementation contract hardcoded into the BountyFactory is [BountyV0](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Bounty/Implementations/BountyV0.sol).

### [OpenQV0](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/Implementations/OpenQV0.sol)

This is the core contract with which both the frontend and the [OpenQ Oracle](https://github.com/OpenQDev/OpenQ-OZ-Claim-AutoTask) interacts.

It is hosted behind an ERC-1967 [UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) contract.

For that reason it does not have a constructor - it only has an [initialize](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/Implementations/OpenQV0.sol#L28) method.

Being behind an upgradable proxy, the five Events decalred in [IOpenQ](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/IOpenQ.sol) will continue to be emitted from the same proxy even after the implementation is upgraded.

#### onlyOracle

The [`claimBounty`](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/Implementations/OpenQV0.sol#L91) method is protected by the `onlyOracle` modifier defined in [Oraclize](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Oracle/Oraclize.sol).

Oraclize is a contract based off of OpenZeppelin's [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) contract. It exposes methods for updating the oracle's address which is allowed to call claim on the OpenQV0 contract.

The OpenQ Oracle private keys are held in a vault and transaction signer hosted on [OpenZepplelin Defender Relay](https://docs.openzeppelin.com/defender/relay). 

The OpenQ Oracle calls `claimBounty` when the [OpenZeppelin Defender Autotask](https://docs.openzeppelin.com/defender/autotasks) confirms that the person authenticated by the GitHub OAuth token present in the [X-Authorization header](https://github.com/OpenQDev/OpenQ-OZ-Claim-AutoTask/blob/main/main.js#L11) is indeed the person who [closed the bounty with their pull request](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).

### [OpenQStorage](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/Storage/OpenQStorage.sol)

OpenQStorage employs the [EternalStorage pattern](https://fravoll.github.io/solidity-patterns/eternal_storage.html).

It is used by [OpenQStorable](https://github.com/OpenQDev/OpenQ-Contracts/blob/main/contracts/OpenQ/OpenQStorable.sol) to hold several state variables.

As of now, it hold very few state variables - only the address of the BountyFactory.

In the future, the EternalStorage pattern is intended to allow us to upgrade seamlessly.