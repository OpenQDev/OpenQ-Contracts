require("dotenv").config();
const axios = require("axios")

const Web3 = require('web3')
const provider = 'ws://127.0.0.1:9545'
const web3 = new Web3(provider)

const MERGEPAY_ABI = require('./../MergePay.json').abi
const MERGEPAY_ADDRESS = process.env.MERGEPAY_ADDRESS
const MERGEPAY = new web3.eth.Contract(MERGEPAY_ABI, MERGEPAY_ADDRESS)
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS

MERGEPAY.events.RegistrationRequestEvent().on('data', event => {
  console.log(`Registration request: ${event.returnValues.account}, ${event.returnValues.githubUser}`)
  axios
    .post(
      "https://api.github.com/graphql",
      {
        query: `query {
  repositoryOwner (login: "${event.returnValues.githubUser}") {
    repository(name: "${event.returnValues.account}") {
      name
    }
  }
}`
      },
      {
        headers: {
          Authorization: "bearer " + process.env.GITHUB_APP_ACCESS_TOKEN
        }
      }
    )
    .then(data => {
      console.log(data.data.data.repositoryOwner.repository)
      if (data.data.data.repositoryOwner.repository) {
        MERGEPAY.methods.registerConfirm(event.returnValues.githubUser, event.returnValues.account).send({
          from: ORACLE_ADDRESS
        }).then(async () => {
          console.log('Confirmed!')
          console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(ORACLE_ADDRESS)).toString(), "ether"))
        })
      }
    })
})
