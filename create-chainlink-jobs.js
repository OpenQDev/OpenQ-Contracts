const sh = require('shelljs')

sh.echo('Creating Chainlink Bridges...')

sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/register.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/release.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/claim.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/graphql.json')

sh.echo('Creating Chainlink Jobs...')

sh.exec('chainlink jobs create ./chainlink/.jobs/register.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/release.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/claim.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/bool.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/bytes32.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/int256.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/uint256.json')
