const { web3, web3wallet, mergepay, axios } = require('./config')

// listen for incoming events
console.log('Listening for Release events.')
subscription = web3.eth.subscribe('logs', { address: process.env.MERGEPAY_ADDRESS }, (error, result) => {
  if (error) {
    console.log(error)
  } else if (result.topics.includes(web3.utils.sha3("ReleaseIssueDepositsRequestEvent(string,string,string)"))) {
    // registration event
    const data = web3.eth.abi.decodeParameters(['string', 'string', 'string'], result.data)
    const issueId = data[0]
    const githubUser = data[1]
    const owner = data[2]
    console.log(`Release issue: ${githubUser}:${issueId}`)
    // check issue owner
    axios
      .post(
        "https://api.github.com/graphql",
        {
          query: `query {
      node (id: "${issueId}") {
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
        if (data.data.data.node) {
          const repoOwner = data.data.data.node.repository.owner.login

          if (repoOwner === owner) {
            // confirm
            console.log('Repository owner confirmed.')
            mergepay.methods.confirmReleaseIssueDeposits(issueId, githubUser).send({
              from: process.env.ORACLE_ADDRESS
            }).then(async ({gasUsed}) => {
              console.log(`Confirmed. (Gas used: ${gasUsed})`)
              console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
            }).catch(async e => {
              console.log('Confirmation failed!', e)
              console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
            })
          } else {
            console.log('Pull Request invalid.')
          }
        }
      })
  }
})
