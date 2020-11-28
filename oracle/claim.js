const { web3, web3wallet, octopay, axios } = require('./config')

const getAge = date => {
  return (new Date().getTime() - new Date(date).getTime()) / (60 * 60 * 24 * 1000)
}

// listen for incoming events
console.log('Listening for Claim events.')
subscription = web3.eth.subscribe('logs', { address: process.env.OCTOBAY_ADDRESS }, (error, result) => {
  if (error) {
    console.log(error)
  } else if (result.topics.includes(web3.utils.sha3("ClaimPrRequestEvent(string,string)"))) {
    // registration event
    const data = web3.eth.abi.decodeParameters(['string', 'string'], result.data)
    const prId = data[0]
    const githubUser = data[1]
    console.log(`Claim request for: ${githubUser}:${prId}`)
    // check pull request
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
            console.log('Pull Request found. Score: ' + score)
            octopay.methods.confirmClaimPullRequest(prId, githubUser, score).send({
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
