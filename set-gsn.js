const sh = require('shelljs')

const relayHubAddress = require('./evm/build/gsn/RelayHub.json').address
const forwarderAddress = require('./evm/build/gsn/Forwarder.json').address
const paymasterAddress = require('./evm/build/gsn/Paymaster.json').address

sh.sed('-i', /^GSN_RELAYHUB_ADDRESS=.*$/, 'GSN_RELAYHUB_ADDRESS=' + relayHubAddress, '.env')
sh.sed('-i', /^GSN_FORWARDER_ADDRESS=.*$/, 'GSN_FORWARDER_ADDRESS=' + forwarderAddress, '.env')
sh.sed('-i', /^GSN_PAYMASTER_ADDRESS=.*$/, 'GSN_PAYMASTER_ADDRESS=' + paymasterAddress, '.env')
