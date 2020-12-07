(async function() {
  const { web3, axios, fs } = require('./config')

  const depositEmailTemplate = fs.readFileSync("./bots/deposit-notification.html").toString().trim();
  const nodemailer = require("nodemailer")
  const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  })

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
    } else if (result.topics.includes(web3.utils.sha3("IssueDepositEvent(address,uint256,string)"))) {
      // deposit event
      const data = web3.eth.abi.decodeParameters(['address', 'uint256', 'string'], result.data)
      const depositer = data[0]
      const amount = data[1]
      const amountFormatted = Number(web3.utils.fromWei(amount, "ether"))
      const issueId = data[2]
      console.log(`Deposit: ${depositer} deposits ${amountFormatted} ETH on ${issueId}`)
      // get issue url and owner email
      axios
        .post(
          "https://api.github.com/graphql",
          {
            query: `query {
              node (id: "${issueId}") {
                ... on Issue {
                  url,
                  title,
                  repository {
                    owner {
                      ... on User {
                        email
                      }
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
        .then(async data => {
          if (data.data.data.node) {
            // tweet
            const tweet = await twApp.post(
              'statuses/update',
              {
                status: `${amountFormatted} ETH was deposited on this issue: ${data.data.data.node.url} #eth #ethereum #github #opensource`
              }
            )
            console.log('Tweet ID: ' + tweet.id)

            // mail
            const mailHtml = depositEmailTemplate
              .replace('{{ title }}', `OctoBay: ${amountFormatted} ETH deposited on: ${data.data.data.node.title}`)
              .replace('{{ previewText }}', `Visit octobay.uber.space to release or refund the depost.`)
              .replace('{{ headline }}', `${amountFormatted} ETH deposited on: ${data.data.data.node.title}`)
              .replace('{{ issueUrl }}', data.data.data.node.url)
            const mailInfo = await mailTransporter.sendMail({
              from: '"OctoBay" <octobay@uber.space>',
              to: data.data.data.node.repository.owner.email,
              subject: `OctoBay: ${amountFormatted} ETH deposited on: ${data.data.data.node.title}`,
              text: mailHtml,
              html: mailHtml,
            })
            console.log('Mail sent: ' + mailInfo.messageId)
          }
        }).catch(console.error)
    }
  })
})().catch(console.error)
