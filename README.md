# OctoBay

## Local Development Setup

### Prepare

You need Node v12.18, Go 1.14 and an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample) as well as a GitHub [OAuth app](https://github.com/settings/applications/new) client ID and secret and a [personal access token](https://github.com/settings/tokens/new). You need to provide those during installation.

## Install

Clone the repository and install its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay && yarn
```

Now start the local Ethereum node, the Gas Station Network and the Chainlink node and its adapters, all in their own terminal sessions.

```bash
yarn evm
# or: yarn evm 'mnemonic seed phrase'
```

```bash
yarn evm:gsn
```

```bash
yarn chainlink:node
```

```bash
yarn chainlink:adapters
```

When running the Chainlink node for the first time, you will be asked to set an email address and a password. You'll need those in the next step. When the node is running, open http://localhost:6688/config in your browser, login and copy your Chainlink node's `ACCOUNT_ADDRESS` to your `.env` file.

```
CHAINLINK_NODE_ADDRESS=0x...
```

## Deploy Contracts

Now you can deploy the contracts. During deployment you will be asked to log in to your Chainlink node, using your email and password from before, so the necessary job specifications can be created for you.

```bash
yarn evm:deploy
```

This will deploy all OctoBay contracts as well as the Chainlink token and an oracle, create jobs for that oracle on the Chainlink node and configure the OctoBay contract accordingly and also make sure all contracts are funded properly.

## Run App

Now run the app and open `http://localhost:3000` in your browser.

```bash
yarn app
```
