# Upgrade OpenQ Proxy

## Dry-run Upgrade with @openzeppelin/openzeppelin-upgrades

This plug-in will verify that the new implementation contract:

✅ Does not have any [storage layout incompatibilities with the current implementation](https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#what-does-it-mean-for-an-implementation-to-be-compatible)
✅ Has an `upgradeTo(address)` method on it, without which future upgrades would not be possible

We cannot use this for the actual deployment as it is initiated by a Gnosis Multisig

## Initiate Transaction in Gnosis Safe

The [Polygon OpenQ Admin Gnosis Safe](https://gnosis-safe.io/app/matic:0x0d6092F4EB10aF5788e4af3b4d57c45C2A3Be3bb) is the owner of the OpenQ Proxy contract

- New Transaction -> Contract Interaction
- Provide OpenQ Proxy Contract Address