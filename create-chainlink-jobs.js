const sh = require('shelljs')
const oracle = require('./evm/build/octobay/Oracle.json')
const oracleAddress = oracle.networks[Object.keys(oracle.networks)[0]].address

sh.echo('Creating Chainlink Bridges...')

sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/register.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/release.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/claim.json')
sh.exec('chainlink bridges create ./chainlink/.adapters/bridges/graphql.json')

sh.echo('Creating Chainlink Jobs...')

// copying spec templates
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/register.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/release.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/claim.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/bool.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/bytes32.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/int256.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/uint256.json')

// creating jobs
sh.exec('chainlink jobs create ./chainlink/.jobs/register.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/release.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/claim.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/bool.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/bytes32.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/int256.json')
sh.exec('chainlink jobs create ./chainlink/.jobs/graphql/uint256.json')

// store job ids in filenames
sh.exec('chainlink jobs list', (code, output) => {
  const jobIDs = output.match(/[a-f0-9]{32}/ig)
  sh.cp('./chainlink/.jobs/register.json', `./chainlink/.jobs/register.${jobIDs[0]}.json`)
  sh.cp('./chainlink/.jobs/release.json', `./chainlink/.jobs/release.${jobIDs[1]}.json`)
  sh.cp('./chainlink/.jobs/claim.json', `./chainlink/.jobs/claim.${jobIDs[2]}.json`)
  sh.cp('./chainlink/.jobs/graphql/bool.json', `./chainlink/.jobs/graphql/bool.${jobIDs[3]}.json`)
  sh.cp('./chainlink/.jobs/graphql/bytes32.json', `./chainlink/.jobs/graphql/bytes32.${jobIDs[4]}.json`)
  sh.cp('./chainlink/.jobs/graphql/int256.json', `./chainlink/.jobs/graphql/int256.${jobIDs[5]}.json`)
  sh.cp('./chainlink/.jobs/graphql/uint256.json', `./chainlink/.jobs/graphql/uint256.${jobIDs[6]}.json`)
})
