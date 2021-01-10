# OctoBay

## Local Development Setup

You need Node v12.18, Go 1.14 and an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample) as well as a GitHub [OAuth app](https://github.com/settings/applications/new) and a [personal access token](https://github.com/settings/tokens/new).

Install the repository and its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay && yarn
```

You will be asked to enter your GitHub client ID and secret and your personal access token.

Now start the local Ethereum node, the Gas Station Network and the Chainlink node and its adapters, all in their own terminal sessions.

```bash
yarn evm
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

When running the Chainlink node for the first time, you will be asked to set an email address and a password. When the node is running, open http://localhost:6688/config in your browser, login and copy your Chainlink node's `ACCOUNT_ADDRESS` to your `.env` file.

```
CHAINLINK_NODE_ADDRESS=0x...
```

Now you can deploy the contracts. During deployment you will be asked to log in to your Chainlink node, using your email and password from before, so the jobs can be created for you.

```bash
yarn evm:deploy
```

Now run the app and open `http://localhost:3000` in your browser.

```bash
yarn app
```
