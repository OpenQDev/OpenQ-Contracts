# OpenQ Contracts

This is the API middleware between the OpenQ frontend and the OpenQ backend.

## Stack
Package Manger: yarn
Language: Solidity
Toolchain: Hardhat

## Contracts

### OpenQStorage

### DepositStorage

### UserAddressStorage

### OpenQ

## Deployment

Start a hardhat Ethereum Node

```bash
yarn node
```

To deploy all contracts to the Hardhat node running on localhost:8485, run:

```bash
yarn deploy:local
```

To deploy all contracts to Rinkeby, run:

```bash
yarn deploy:local
```

## Test
```bash
npm test
```