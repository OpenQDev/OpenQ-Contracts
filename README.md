# OctoBay

## Local Setup

### ETH Node

Run a local ETH node on port 8545.

```bash
ganache-cli -l 8000000
```

### Chainlink Node

Run a local Chainlink node (v0.9.4). (You need an empty postgres database named "chainlink".)

https://github.com/smartcontractkit/chainlink#install

```bash
git clone https://github.com/smartcontractkit/chainlink && cd chainlink
git checkout tags/v0.9.4
make install
chainlink local start
```

### External Adapters

```bash
git clone https://github.com/mktcode/octobay-chainlink-adapters && cd octobay-chainlink-adapters
yarn
yarn start
```

### Web App


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

#### Gas Station Network

OctoBay uses the [Gas Station Network](https://opengsn.org/) to enable [gasless meta transactions](https://github.com/ethereum/EIPs/issues/1776).
When installing the repository's dependcies you also installed `@opengsn/gsn`.

From the octobay directory run `npx gsn start`. It will deploy all the necessary contracts for you to your local ganache instance and start a relay server.

```
== startGSN: ready.
GSN started

  RelayHub: 0x78F28dfEb8afAec22d88a5F2007f5f6FeE248645
  StakeManager: 0x1A6f5059b5F7E129E17Fe3B2aC3A1bDeCa6F7E41
  Penalizer: 0x9CcCa2894453eFc3559f82dD108A4ebcE497cf03
  VersionRegistry: 0xf9307923694E9114a0ad9Dc5B0Acf8Ddcf9248F0
  Forwarder: 0xe5D11c15273B475346d1EBAD709377cBa8e6987f
  Paymaster : 0x169BAB8aa3e139B9BE9E83120D2157802d6e3947
Relay is active, URL = http://127.0.0.1:45937 . Press Ctrl-C to abort
```

Now add the following addresses to your `.env` file:

```
GSN_RELAYHUB_ADDRESS=0x78F28dfEb8afAec22d88a5F2007f5f6FeE248645
GSN_FORWARDER_ADDRESS=0xe5D11c15273B475346d1EBAD709377cBa8e6987f
GSN_PAYMASTER_ADDRESS=0x169BAB8aa3e139B9BE9E83120D2157802d6e3947
```

You also need to make sure that your paymaster contract is funded with 1 ETH.

#### OctoBay Contracts

A LINK token, a Chainlink oracle and the OctoBay contract will be deployed, with the GSN forwarder and paymaster addresses set.

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

#### Deeplinks

For convenience the following deeplinks are available to prefill the send form:

```
/u/<username>
/u/<username>/<amount>

/i/<username>/<repository>/<issue>
/i/<username>/<repository>/<issue>/<amount>

/r/<username>/<repository>
/r/<username>/<repository>/<amount>
```
