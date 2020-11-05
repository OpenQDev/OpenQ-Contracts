require("dotenv").config();
const axios = require("axios")

const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".mnemonic").toString().trim();
// const node = `wss://kovan.infura.io/ws/v3/${process.env.INFURA_KEY}`
const node = 'ws://localhost:9545'
const web3 = new Web3(node)
const walletProvider = new HDWalletProvider(mnemonic, node)
const web3wallet = new Web3(walletProvider)
const mergepay = new web3wallet.eth.Contract(require('./../MergePay.json').abi, process.env.MERGEPAY_ADDRESS)

// listen for incoming events
subscription = web3.eth.subscribe('logs', { address: process.env.MERGEPAY_ADDRESS }, (error, result) => {
  if (error) {
    console.log(error)
  } else if (result.topics.includes(web3.utils.sha3("RegistrationRequestEvent(address,string)"))) {
    // registration event
    const data = web3.eth.abi.decodeParameters(['address', 'string'], result.data)
    const address = data[0]
    const githubUser = data[1]
    console.log(`Registration request for: ${githubUser}:${address}`)
    // check for repository named after address
    axios
      .post(
        "https://api.github.com/graphql",
        {
          query: `query {
  repositoryOwner (login: "${githubUser}") {
    repository(name: "${address}") {
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
        if (data.data.data.repositoryOwner.repository) {
          // confirm
          console.log('Repository found.')
          mergepay.methods.registerConfirm(githubUser, address).send({
            from: process.env.ORACLE_ADDRESS
          }).then(async () => {
            console.log('Confirmed.')
            console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
          }).catch(async e => {
            console.log('Confirmation failed!', e)
            console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
          })
        }
      })
  }
})
