const fs = require('fs')
const OctoBay = artifacts.require("OctoBay")
const Oracle = artifacts.require("Oracle")
const githubUser = 'mktcode'

contract("OctoBay", async accounts => {
  let oracle;

  it(`Check correct oracle and jobIDs were set in Octobay`, async () => {
    const octoBayInstance = await OctoBay.deployed()
    const oracleInstance = await Oracle.deployed()
    oracle = await octoBayInstance.activeOracles(oracleInstance.address)

    const registerJobExists = fs.statSync(`./../../chainlink/.jobs/register.${web3.utils.hexToAscii(oracle.registerJobId)}.json`)
    const releaseJobExists = fs.statSync(`./../../chainlink/.jobs/release.${web3.utils.hexToAscii(oracle.releaseJobId)}.json`)
    const claimJobExists = fs.statSync(`./../../chainlink/.jobs/claim.${web3.utils.hexToAscii(oracle.claimJobId)}.json`)
    const graphqlBoolJobExists = fs.statSync(`./../../chainlink/.jobs/graphql/bool.${web3.utils.hexToAscii(oracle.graphqlBoolJobId)}.json`)
    const graphqlBytes32JobExists = fs.statSync(`./../../chainlink/.jobs/graphql/bytes32.${web3.utils.hexToAscii(oracle.graphqlBytes32JobId)}.json`)
    const graphqlInt256JobExists = fs.statSync(`./../../chainlink/.jobs/graphql/int256.${web3.utils.hexToAscii(oracle.graphqlInt256JobId)}.json`)
    const graphqlUint256JobExists = fs.statSync(`./../../chainlink/.jobs/graphql/uint256.${web3.utils.hexToAscii(oracle.graphqlUint256JobId)}.json`)

    // assert.equal(registerJobExists, true, 'Register job correct.')
    // assert.equal(releaseJobExists, true, 'Release job correct.')
    // assert.equal(claimJobExists, true, 'Claim job correct.')
    // assert.equal(graphqlBoolJobExists, true, 'GraphQL Bool job correct.')
    // assert.equal(graphqlBytes32JobExists, true, 'GraphQL Bytes32 job correct.')
    // assert.equal(graphqlInt256JobExists, true, 'GraphQL Int256 job correct.')
    // assert.equal(graphqlUint256JobExists, true, 'GraphQL Uint256 job correct.')
  })

  it(`${githubUser} should be unregistered`, async () => {
    const instance = await OctoBay.deployed()
    const userId = await instance.userIDsByGithubUser(githubUser)
    assert.equal(
      userId,
      0,
      `${githubUser} is already registered`
    )
  })

  it("registration should get rejected due to insufficiennt LINK balance", async () => {
    const instance = await OctoBay.deployed()
    const error = await instance.register(oracle.address, web3.utils.toHex(oracle.registerJobId), 'mktcode').catch(e => e)
    assert.equal(
      error.reason,
      'ERC20: transfer amount exceeds balance',
      "registration was accepted, LINK balance was > 0"
    )
  })
})
