# OpenQ Smart Contracts 

This is the API middleware between the OpenQ frontend and the OpenQ backend.

## Stack
Package Manger: yarn
Language: Solidity
Toolchain: Hardhat

## Contracts

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

```bash
yarn deploy:local
```

## Test
```bash
npm test
```

## Environments

### Docker

```bash
PROVIDER_URL="http://ethnode:8545"
CLIENT="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHAIN_ID=31337
```

### Mumbai

```bash
PROVIDER_URL="https://rpc-mumbai.maticvigil.com/v1/258e87c299409a354a268f96a06f9e6ae7ab8cea"
CLIENT="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHAIN_ID=80001
```

### Polygon

```bash
PROVIDER_URL="https://matic-mainnet.chainstacklabs.com"
CLIENT="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHAIN_ID=137
```
