import axios from "axios"

require("dotenv").config()

export default (req, res) => {
  let issueId = req.params.issueId
  axios
    .post(
      "https://api.github.com/graphql",
      {
        query: `query {
  node(id:"${issueId}") {
    ... on Issue {
      id
      title
      url
      number
      closed
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
          Authorization: "bearer " + process.env.GITHUB_APP_ACCESS_TOKEN
        }
      }
    )
    .then(data => {
      res.json(data.data.data.node)
    }).catch(e => res.json({ error: 1 }))
}
