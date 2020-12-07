(async function() {
  const { web3, axios, fs } = require('./config')

  const emailTemplate = fs.readFileSync("./bots/send-notification.html").toString().trim();
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

  // listen for incoming events
  console.log('Listening for Send events.')
  subscription = web3.eth.subscribe('logs', { address: process.env.OCTOBAY_ADDRESS }, (error, result) => {
    if (error) {
      console.log(error)
    } else {
      const isUserDepositEvent = result.topics.includes(web3.utils.sha3("UserDepositEvent(address,uint256,string)"))
      const isUserSendEvent = result.topics.includes(web3.utils.sha3("UserSendEvent(address,uint256,string)"))

      if (isUserDepositEvent || isUserSendEvent) {
        const data = web3.eth.abi.decodeParameters(['address', 'uint256', 'string'], result.data)
        const depositer = data[0]
        const amount = data[1]
        const amountFormatted = Number(web3.utils.fromWei(amount, "ether"))
        const githubUser = data[2]
        console.log(`Send: ${depositer} sent ${amountFormatted} ETH to ${githubUser}${isUserDepositEvent ? ' (not registered)' : ''}`)
        // get github user's email
        axios
        .post(
          "https://api.github.com/graphql",
          {
            query: `query {
              user (login: "${githubUser}") {
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
        .then(async data => {
          if (data.data.data.user) {
            // mail
            const mailHtml = emailTemplate
            .replace('{{ title }}', `OctoBay: You received ${amountFormatted} ETH.`)
            .replace('{{ previewText }}', isUserDepositEvent ? `Visit octobay.uber.space to register and withdraw.` : 'Check your Ethereum account. The ETH should be there already.')
            .replace('{{ text }}', isUserDepositEvent ? `<h3>Welcome to OctoBay!<h3> OctoBay is an Ethereum payment service for GitHub and you just received ${amountFormatted} ETH from the address ${depositer}.<br><br>You need to connect and Ethereum address with your GitHub account before you can withdraw the deposit. Future transfers via OctoBay will then arrive directly in your wallet.<br><b>Note: As long as you did not withdraw this deposit, the sender can take it back at any time.</b>` : 'Since you\'ve already connected an Ethereum address with your GitHub account, you don\'t need to do anything. Just check your Ethereum account for the transfer.')
            .replace('{{ headline }}', `You received ${amountFormatted} ETH.`)
            const mailInfo = await mailTransporter.sendMail({
              from: '"OctoBay" <octobay@uber.space>',
              to: data.data.data.user.email,
              subject: `OctoBay: You received ${amountFormatted} ETH.`,
              text: mailHtml,
              html: mailHtml,
            })
            console.log('Mail sent: ' + mailInfo.messageId)
          }
        }).catch(console.error)
      }
    }
  })
})().catch(console.error)
