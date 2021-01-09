const sh = require('shelljs')

const octoBay = require('./evm/build/octobay/OctoBay.json')
const octoPin = require('./evm/build/octobay/OctoPin.json')
const link = require('./evm/build/octobay/LinkToken.json')
const oracle = require('./evm/build/octobay/Oracle.json')

const octoBayAddress = octoBay.networks[Object.keys(octoBay.networks)[0]].address
const octoPinAddress = octoPin.networks[Object.keys(octoPin.networks)[0]].address
const linkAddress = link.networks[Object.keys(link.networks)[0]].address
const oracleAddress = oracle.networks[Object.keys(oracle.networks)[0]].address

// .env
sh.sed('-i', /^OCTOBAY_ADDRESS=.*$/, 'OCTOBAY_ADDRESS=' + octoBayAddress, '.env')
sh.sed('-i', /^OCTOPIN_ADDRESS=.*$/, 'OCTOPIN_ADDRESS=' + octoPinAddress, '.env')
sh.sed('-i', /^LINK_TOKEN_ADDRESS=.*$/, 'LINK_TOKEN_ADDRESS=' + linkAddress, '.env')
sh.sed('-i', /^LINK_CONTRACT_ADDRESS=.*$/, 'LINK_CONTRACT_ADDRESS=' + linkAddress, './chainlink/.node/.env')

// ./chainlink/.jobs/
sh.rm('-rf', './chainlink/.jobs')
sh.cp('-rf', './chainlink/.adapters/jobs', './chainlink/.jobs')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/register.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/release.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/claim.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/bool.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/bytes32.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/int256.json')
sh.sed('-i', 'YOUR_ORACLE_CONTRACT_ADDRESS', oracleAddress, './chainlink/.jobs/graphql/uint256.json')
