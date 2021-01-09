# OctoBay

## Local Development Setup

You need Node 12 and an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample).

Install the repository and its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay && yarn
```

Start the local Ethereum node, the Gas Station Network, the Chainlink node and its adapters, all in their own terminal sessions.

```bash
yarn evm:start
yarn evm:gsn:start
yarn chainlink:node
yarn chainlink:adapters
```

When running the Chainlink node for the first time, you will be asked to set an email address and a password. When the node is running, open http://localhost:6688/config in your browser, login and copy your Chainlink node's `ACCOUNT_ADDRESS` to your `.env` file.

```
CHAINLINK_NODE_ADDRESS=0x...
```

Now you can deploy the contracts.

```bash
yarn evm:deploy
```

The last step is to create the jobs for the Chainlink node. You will have to log in, using your email and password from before.

```bash
yarn chainlink:jobs:create
```

Now you can run the app and open `http://localhost:3000` in your browser.

```bash
yarn app:dev
```

### External Services

#### GitHub

You need to set up a GitHub app and provide its credentials.

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_APP_ACCESS_TOKEN=...
```

#### Twitter

To support Twitter posts and notifications you need to set up a Twitter app and provide its credentials.

```
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_APP_ACCESS_TOKEN=...
TWITTER_APP_SECRET=...
TWITTER_APP_BEARER_TOKEN=...
```

#### E-Mail

To support e-mail notifications you need to provide credentials for an SMTP server.

```
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```
