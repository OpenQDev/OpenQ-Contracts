# OctoBay

## Local Development Setup

You need an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample).

Install the repository and its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay && yarn
```

Start the local Ethereum node, the Chainlink node and its adapters.

```bash
yarn evm:start
yarn chainlink:node
yarn chainlink:adapters
```

Open http://localhost:6688/config in your browser and copy your Chainlink node's `ACCOUNT_ADDRESS` to your `.env` file.

```
CHAINLINK_NODE_ADDRESS=0x...
```

Now you can deploy the contracts and run the app.

```bash
yarn evm:deploy
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
