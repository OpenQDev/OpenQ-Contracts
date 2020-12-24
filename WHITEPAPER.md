# Ethereum based GitHub Economy

## Basic Idea

1. Onboarding GitHub users to Ethereum.
2. Providing a decentralized system for transfers, bounties, donations and promotions by connecting GitHub with Ethereum and Twitter.

## Onboarding

Any GitHub user, issue or repository can receive ETH/ERC20 payments, without knowing about this service or having an ethereum account. The involved users will be notified on GitHub and also Twitter and email, if provided in their GitHub profile. When they register to receive the funds, there is no need to prefund a newly created Ethereum account. The deposits will be automatically released and the GitHub user can immediately start using the service and act in the Ethereum network.

## Promotion

One of the key aspects of the service is the bounty and promotion system. Issues can be funded and promoted, using a custom token, that is minted through merged pull requests. That way only contributors can mint the token while on the other side they can be spend to promote other issues, projects or even developers.

### Twitter

The custom token can be used to promote issues (1 token), projects (10 token) and developers (5 TKN) on Twitter. Any of these can be promoted by any user but only at a certain rate, e.g. once per day.

### Leaderboard

The leaderboard keeps track of who minted how many tokens by submitting their merged pull requests.

## Oracles

The service uses chainlink nodes as oracles, that run custom external adapters while also acting as relay stations, funded from prior deposits, to provide the seamless onboarding experience.

Oracles will also be the only form of project funding. Actions that don't require oracles, won't cost more than the Etherem gas fee. While Ethereum gas costs will be the only user-facing fees, oracles will still be payed in LINK but also ETH to directly cover the gas cost and enable a more autonomous operation.

Up to ten oracles will balance out rate limitations GitHub, Twitter and other services have and ensure decentralization.

## Current Status

...
Basic Chainlink integration is done but further additions/improvements will be necessary.

## Challenges
