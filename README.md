# OctoBay

## Local Setup

0. Database

You need an empty postgres database named `chainlink-local` with the default `postgres:postgres` user and port 5432 (or adjust chainlink/.env.sample).

1. Install the repository and its dependencies.

```bash
git clone https://github.com/mktcode/octobay && cd octobay
yarn
```

2. Start the local Ethereum node.

```bash
yarn evm:start
```

3. Start chainlink node.

```bash
yarn chainlink:node
```

4. Start chainlink adapters.

```bash
yarn chainlink:adapters
```

5. Deploy the contracts.

```bash
yarn evm:deploy
```

6. Run app.

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
