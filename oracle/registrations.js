const { web3, web3wallet, octopay, axios } = require('./config')

// listen for incoming events
console.log('Listening for Registration events.')
subscription = web3.eth.subscribe('logs', { address: process.env.OCTOBAY_ADDRESS }, (error, result) => {
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
          octopay.methods.registerConfirm(githubUser, address).send({
            from: process.env.ORACLE_ADDRESS
          }).then(async ({gasUsed}) => {
            console.log(`Confirmed. (Gas used: ${gasUsed})`)
            console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
          }).catch(async e => {
            console.log('Confirmation failed!', e)
            console.log('Oracle balance:', web3.utils.fromWei((await web3.eth.getBalance(process.env.ORACLE_ADDRESS)).toString(), "ether"))
          })
        }
      })
  }
})
