const { web3, web3wallet, octobay, axios } = require('./config')

export default (req, res) => {
  let githubUser = req.params.githubUser
  let issueId = req.params.issueId

  // check in contract if exists and unconfirmed
  octobay.methods._releasedIssueRequests(issueId).call().then(releaseRequestUser => {
    octobay.methods._releasedIssueRequestsOwnedBy(issueId).call().then(releaseRequestOwner => {
      if (releaseRequestUser === githubUser) {
        // check if release was requested by issue owner
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

              if (repoOwner === releaseRequestOwner) {
                // confirm
                octobay.methods.confirmReleaseIssueDeposits(issueId, githubUser).send({
                  from: process.env.ORACLE_ADDRESS
                }).then(({gasUsed}) => {
                  res.json({ error: 0, gasUsed })
                }).catch(async e => {
                  res.json({ error: 1 })
                })
              } else {
                res.json({ error: 2 }) // not the repo owner
              }
            } else {
              res.json({ error: 3 })
            }
          }).catch(() => res.json({ error: 4 }))
      } else {
        res.json({ error: 5 })
      }
    }).catch(() => res.json({ error: 6 }))
  }).catch(() => res.json({ error: 7 }))
}
