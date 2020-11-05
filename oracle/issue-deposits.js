require("dotenv").config();
const axios = require("axios")

const Web3 = require('web3')
const web3 = new Web3(`ws://127.0.0.1:9545`)
// const web3 = new Web3(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_KEY}`)

// listen for incoming events
subscription = web3.eth.subscribe('logs', { address: process.env.MERGEPAY_ADDRESS }, (error, result) => {
  if (error) {
    console.log(error)
  } else if (result.topics.includes(web3.utils.sha3("IssueDepositEvent(address,uint256,string)"))) {
    // registration event
    const data = web3.eth.abi.decodeParameters(['address', 'uint256', 'string'], result.data)
    const account = data[0]
    const amount = data[1]
    const issueId = data[2]
    axios.post(
      "https://api.github.com/graphql",
      {
        query: `query {
  node(id:"${issueId}") {
    ... on Issue {
      repository {
        owner {
          login
        }
      }
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
      axios.post(
        "https://api.github.com/graphql",
        {
          query: `query {
            user(login: "${data.data.data.node.repository.owner.login}") {
              login,
              email
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
        console.log(data.data.data.user.email)
      })
    })
  }
})
