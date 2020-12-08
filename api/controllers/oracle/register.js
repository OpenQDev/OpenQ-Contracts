const { web3, web3wallet, octobay, axios } = require('./config')

export default (req, res) => {
  let githubUser = req.params.githubUser
  let ethAddress = req.params.ethAddress

  // check in contract if exists and unconfirmed
  octobay.methods._users(githubUser).call().then(user => {
    if (user.account === ethAddress && !user.confirmed) {
      // then check if repo exists
      axios
        .post(
          "https://api.github.com/graphql",
          {
            query: `query {
    repositoryOwner (login: "${githubUser}") {
      repository(name: "${ethAddress}") {
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
            octobay.methods.registerConfirm(githubUser, ethAddress).send({
              from: process.env.ORACLE_ADDRESS
            }).then(({ gasUsed }) => {
              res.json({ error: 0, gasUsed })
            }).catch(e => {
              res.json({ error: 1 })
            })
          } else {
            res.json({ error: 2 })
          }
        }).catch(() => res.json({ error: 3 }))
    } else {
      res.json({ error: 4 })
    }
  }).catch(() => res.json({ error: 5 }))
}
