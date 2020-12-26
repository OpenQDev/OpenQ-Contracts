const OctoBay = artifacts.require("OctoBay")

const oracle = require('../oracles.json')[0]
const githubUser

contract("OctoBay", async accounts => {
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
    const error = await instance.register(oracle.address, web3.utils.toHex(oracle.jobs.register), 'mktcode').catch(e => e)
    assert.equal(
      error.reason,
      'ERC20: transfer amount exceeds balance',
      "registration was accepted, LINK balance was > 0"
    )
  })
})
