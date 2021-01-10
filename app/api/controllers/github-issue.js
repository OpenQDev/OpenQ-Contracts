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
    issue(number: ${number}) {
      id
      title
      url
      number
      closed
      createdAt
      comments {
        totalCount
      }
      labels(first: 100) {
      	edges {
        	node {
          	name
            color
        	}
      	}
    	}
      repository {
        name
        primaryLanguage {
          name
          color
        }
        owner {
          login
        }
      }
      author {
        ... on User {
          login
          url
          email
        }
      }
    }
  }
}`
      },
      {
        headers: {
          Authorization: "bearer " + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
        }
      }
    )
    .then(data => {
      res.json(data.data.data.repository.issue)
    }).catch(e => res.json({ error: 1 }))
}
