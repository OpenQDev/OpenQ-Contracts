const OctoBay = artifacts.require("OctoBay")
const OctoPin = artifacts.require("OctoPin")
const Oracle = artifacts.require("Oracle")
const LinkToken = artifacts.require("LinkToken")
const someAddress = "0xE781857C5b55ff0551Df167D0B0A4C53BFD08e1D"
const someGithubUser = "mktcode"

contract("OctoBay", async accounts => {
  it("sets OctoPin token", async () => {
    const octobay = await OctoBay.deployed()
    const octopin = await OctoPin.deployed()
    await octobay.setOctoPin(octopin.address)
    const newAddress = await octobay.octoPin()
    assert.equal(octopin.address, newAddress)
  })

  it("sets Oracle", async () => {
    const octobay = await OctoBay.deployed()
    await octobay.setOracle(
      someAddress,
      "Main",
      web3.utils.toHex("0"),
      web3.utils.toHex("0"),
      web3.utils.toHex("0"),
      web3.utils.toHex("0"),
      web3.utils.toHex("0"),
      web3.utils.toHex("0"),
      web3.utils.toHex("0")
    )
    const oracles = await octobay.getOracles()
    assert.equal(oracles.includes(someAddress), true)
  })

  it("removes Oracle", async () => {
    const octobay = await OctoBay.deployed()
    await octobay.removeOracle(someAddress)
    const oracles = await octobay.getOracles()
    assert.equal(oracles.includes(someAddress), false)
  })

  it("sets Oracle fulfill permission", async () => {
    const oracle = await Oracle.deployed()
    const tx = await oracle.setFulfillmentPermission(accounts[0], true)
    assert.notEqual(tx, null)
  })

  it("receives LINK token", async () => {
    const octobay = await OctoBay.deployed()
    const link = await LinkToken.deployed()
    const transferBalance = '10000000000000000000'
    await link.transfer(octobay.address, transferBalance)
    const balance = await link.balanceOf(octobay.address)
    assert.equal(balance.toString(), transferBalance)
  })

  let registerRequestId
  it("registers a user", async () => {
    const octobay = await OctoBay.deployed()
    const oracles = await octobay.getOracles()
    const oracle = await octobay.activeOracles(oracles[0])
    const registerRequest = await octobay.register(oracles[0], oracle.registerJobId, someGithubUser)
    registerRequestId = registerRequest.logs[0].args.id
    const user = await octobay.users(registerRequestId)

    assert.equal(user.status.toString(), '1')
  })

  // it("confirms the user", async () => {
  //   const octobay = await OctoBay.deployed()
  //   const oracle = await Oracle.deployed()
  //   await octobay.confirmRegistration(registerRequestId, { from: accounts[0] })
  //   const user = await octobay.users(registerRequestId)
  //
  //   assert.equal(user.status.toString(), '2')
  // })
})
