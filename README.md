# OctoBay

## Local Development Setup

You need Node v12.18, Go 1.14 and an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample).

Install the repository and its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay && yarn
```

Start the local Ethereum node, the Gas Station Network, the Chainlink node and its adapters, all in their own terminal sessions.

```bash
yarn evm
yarn evm:gsn
yarn chainlink:node
yarn chainlink:adapters
```

When running the Chainlink node for the first time, you will be asked to set an email address and a password. When the node is running, open http://localhost:6688/config in your browser, login and copy your Chainlink node's `ACCOUNT_ADDRESS` to your `.env` file.

```
CHAINLINK_NODE_ADDRESS=0x...
```

Now you can deploy the contracts. During deployment you will be asked to log in to your Chainlink node, using your email and password from before, so that the jobs can be created for you.

```bash
yarn evm:deploy
```

For the API and GitHub login to work, a GitHub app is required. Temporary test credentials are included but you can also create your own test app.
Go to https://github.com/settings/applications/new, use `http://localhost:3000/auth/github` for the authorization callback URL and copy the credentials to your `.env` file.

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_APP_ACCESS_TOKEN=...
```

Now you can run the app and open `http://localhost:3000` in your browser.

```bash
yarn app
```
