const { web3, web3wallet, octobay, axios } = require('./config')

const getAge = date => {
  return (new Date().getTime() - new Date(date).getTime()) / (60 * 60 * 24 * 1000)
}

export default (req, res) => {
  let githubUser = req.params.githubUser
  let prId = req.params.prId

  // check in contract if request exists and unconfirmed
  octobay.methods._claimedPullRequests(prId).call().then(claimed => {
    claimed = Number(claimed)
    if (claimed === 1) { // 0 = no request, 1 = requested, 2 = confirmed
      // then check if repo exists
      axios
        .post(
          "https://api.github.com/graphql",
          {
            query: `query {
        node (id: "${prId}") {
          id
          ... on PullRequest {
            id
            mergedAt
            author {
              ... on User {
                login,
                createdAt,
                followers {
                  totalCount
                }
              }
            }
            repository {
              owner {
                login
              }
              createdAt,
              stargazers {
                totalCount
              }
              forks {
                totalCount
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
            let score = 0

            const userAge = getAge(data.data.data.node.author.createdAt)
            const userFollowers = data.data.data.node.author.followers.totalCount
            const repoAge = getAge(data.data.data.node.repository.createdAt)
            const repoOwner = data.data.data.node.repository.owner.login
            const repoStars = data.data.data.node.repository.stargazers.totalCount
            const repoForks = data.data.data.node.repository.forks.totalCount
            const mergedAt = getAge(data.data.data.node.mergedAt)

            if (repoOwner != githubUser && mergedAt < process.env.MAX_CLAIMPR_AGE) {
              if (userAge > 365) score += 1;
              if (userAge > 365 * 5) score += 2;
              if (userAge > 365 * 10) score += 4;

              if (userFollowers > 50) score += 1;
              if (userFollowers > 250) score += 2;
              if (userFollowers > 1000) score += 4;

              if (repoAge > 90) score += 1;
              if (repoAge > 365) score += 2;
              if (repoAge > 365 * 5) score += 4;

              if (repoStars > 50) score += 1;
              if (repoStars > 250) score += 2;
              if (repoStars > 1000) score += 4;

              if (repoForks > 10) score += 1;
              if (repoForks > 50) score += 2;
              if (repoForks > 250) score += 4;

              score = Math.min(Math.round(Math.round((score / 35) * 100)), 100)

              // confirm
              octobay.methods.confirmClaimPullRequest(prId, githubUser, score).send({
                from: process.env.ORACLE_ADDRESS
              }).then(({ gasUsed }) => {
                res.json({ error: 0, gasUsed  })
              }).catch(() => {
                res.json({ error: 1 })
              })
            } else {
              res.json({ error: 2 })
            }
          } else {
            res.json({ error: 1 })
          }
        }).catch(() => res.json({ error: 1 }))
    } else {
      res.json({ error: 3 })
    }
  }).catch(() => res.json({ error: 1 }))
}
