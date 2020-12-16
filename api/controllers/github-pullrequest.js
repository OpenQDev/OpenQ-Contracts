import axios from "axios"

require("dotenv").config()

export default (req, res) => {
  let owner = req.params.owner
  let repo = req.params.repo
  let number = req.params.number
  axios
    .post(
      "https://api.github.com/graphql",
      {
        query: `query {
  repository(owner: "${owner}", name:"${repo}") {
    pullRequest(number: ${number}) {
      id
      number
      author {
        ... on User {
          login
          url
          createdAt
          followers {
            totalCount
          }
        }
      }
      title
      state
      merged
      mergedAt
      createdAt
      comments {
        totalCount
      }
      repository {
        owner {
          login
        }
        createdAt
        forkCount
        viewerCanAdminister
        stargazers {
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
      res.json(data.data.data.repository.pullRequest)
    }).catch(() => res.json({ error: 1 }))
}
