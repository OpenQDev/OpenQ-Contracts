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
npm run node
```

To deploy all contracts to the Hardhat node running on localhost:8485, run:

```bash
npm run deploy:local
```

To deploy all contracts to Rinkeby, run:

```bash
npm run deploy:local
```

## Test
```bash
npm test
```