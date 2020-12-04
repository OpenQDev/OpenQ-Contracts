(async function() {
  const { web3, axios } = require('./config')
  const Twitter = require('twitter-lite')
  const twApp = new Twitter({
    subdomain: "api",
    version: "1.1",
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token_key: process.env.TWITTER_APP_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_APP_SECRET
  })

  // listen for incoming events
  console.log('Listening for Deposit events.')
  subscription = web3.eth.subscribe('logs', { address: process.env.OCTOBAY_ADDRESS }, (error, result) => {
    if (error) {
      console.log(error)
    } else if (result.topics.includes(web3.utils.sha3("IssueDepositEvent(address, uint256, string)"))) {
      // registration event
      const data = web3.eth.abi.decodeParameters(['address', 'uint256', 'string'], result.data)
      const depositer = data[0]
      const amount = data[1]
      const issueId = data[2]
      console.log(`Deposit: ${depositer} deposits ${amount} on ${issueId}`)
      // get issue url
      axios
        .post(
          "https://api.github.com/graphql",
          {
            query: `query { node (id: "${issueId}") { ... on Issue { url } } }`
          },
          {
            headers: {
              Authorization: "bearer " + process.env.GITHUB_APP_ACCESS_TOKEN
            }
          }
        )
        .then(data => {
          if (data.data.data.node) {
            // tweet
            twApp.post('statuses/update', {
              status: `Someone deposited ${amount} ETH on this issue:`,
              attachment_url: data.data.data.node.url
            }, error => {
              if (error) console.log(error)
              else console.log('Tweet posted.')
            })
          }
        })
    }
  })
})().catch(e => console.log(e))
