# OctoBay

## Local Setup

### ETH Node

Run a local ETH node on port 8545.

```bash
ganache-cli -l 8000000
```

### Chainlink Node

Run a local Chainlink node (v0.9.4).

https://github.com/smartcontractkit/chainlink#install

```bash
git clone https://github.com/smartcontractkit/chainlink && cd chainlink
git checkout tags/v0.9.4
make install
chainlink local start
```

### App


```bash
git clone https://github.com/mktcode/octobay && cd octobay
yarn
```

Create a `.env` file and add some required parameters:

```
DEV=true
API_URL=http://localhost:3000/api
ETH_NODE=wss://localhost:8584
MAX_CLAIMPR_AGE=1800
CHAINLINK_NODE_ADDRESS=0x...
```

You find your Chainlink node's ETH address in the operator dashboard.

![chainlink-node-address](https://user-images.githubusercontent.com/6792578/103159652-50d57900-47cc-11eb-9b77-dcfac8dc71a3.png)

### Deploy Contracts

A LINK token, a Chainlink oracle and the OctoBay contract will be deployed.

```
truffle migrate --network development
```

Add the contract addresses to your `.env` file.

```
OCTOBAY_ADDRESS=0x...
LINK_TOKEN_ADDRESS=0x...
```

Also add the link token address to your Chainlink node's `.env` file.

```
LINK_CONTRACT_ADDRESS=...
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

### Run Website

```bash
# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start
```

For more detailed explanation check out [Nuxt.js docs](https://nuxtjs.org).
