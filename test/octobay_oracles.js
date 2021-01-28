const OctoBay = artifacts.require("OctoBay")
const Oracle = artifacts.require("Oracle")
const LinkToken = artifacts.require("LinkToken")
const someAddress = "0xE781857C5b55ff0551Df167D0B0A4C53BFD08e1D"
const someGithubUser = "mktcode"
const someOtherGithubUser = "wehmoen"
const someIssueId = 'MDU6SXNzdWU3NjA2NDYzNjg='
const someJobId = '52b598790eec4799a94e601b4cba1ad5'
const someOtherJobId = 'e0edff1c4ece415bbe55f6bb17373d01'
const jobs = {
  'register': 0,
  'release': 1,
  'claim': 2,
  'twitterPost': 3,
  'twitterFollowers': 4
}

contract("OctoBay", async accounts => {

  let octobay;
  before(async () => {
    octobay = await OctoBay.deployed();
  })

  it("Adds Oracle", async () => {
    await octobay.addOracle(
      someAddress,
      "Main",
      [jobs.register, jobs.claim],
      [
        [web3.utils.fromAscii(someJobId), web3.utils.toWei('1', 'ether')],
        [web3.utils.fromAscii(someOtherJobId), web3.utils.toWei('2', 'ether')]
      ]
    )
    const oracles = await octobay.getOracles()
    assert.equal(oracles.includes(someAddress), true)

    // assert job details
    const job = await octobay.getOracleJob(someAddress, jobs.register);
    assert.equal(web3.utils.toAscii(job[0]), someJobId)
    assert.equal(job[1], web3.utils.toWei('1').toString())
  })

  it("Change Oralce Name", async () => {
    await octobay.changeOracleName(someAddress, "Primary");
    const name = await octobay.getOracleName(someAddress);
    assert.equal(name, "Primary");
  })

  it("Add jobs to an Oracle", async () => {
    await octobay.addOracleJob(
      someAddress,
      jobs.twitterFollowers,
      [
        web3.utils.fromAscii(someJobId),
        web3.utils.toWei('1', 'ether')
      ]
    );

    const job = await octobay.getOracleJob(someAddress, jobs.twitterFollowers);
    assert.equal(web3.utils.toAscii(job[0]), someJobId)
    assert.equal(job[1], web3.utils.toWei('1').toString())
  })

  it("Remove oracle Job", async () => {
    await octobay.removeOracleJob(someAddress, jobs.twitterFollowers);

    const job = await octobay.getOracleJob(someAddress, jobs.twitterFollowers);
    assert.equal(job[0], '0x0000000000000000000000000000000000000000000000000000000000000000')
    assert.equal(job[1].toString(), '0')
  })

  it("removes Oracle", async () => {
    await octobay.removeOracle(someAddress)
    const oracles = await octobay.getOracles()
    assert.equal(oracles.includes(someAddress), false)
  })

})
