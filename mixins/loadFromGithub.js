import axios from "axios"

export default {
  methods: {
    loadPullRequest(owner, repo, number, accessToken) {
      return axios.post(
        "https://api.github.com/graphql",
        {
          query: `query {
  repository(owner: "${owner}", name:"${repo}") {
    owner {
      login
    }
    createdAt
    forkCount
    viewerCanAdminister
    stargazers {
      totalCount
    }
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
    }
  }
}`
        },
        {
          headers: {
            Authorization: "bearer " + accessToken
          }
        }
      ).then(response => {
        return response.data.data.repository
      })
    },
    loadIssue(owner, repo, number) {
      return axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`).then(res => res.data)
    },
    loadUser(username) {
      return axios.get(`${process.env.API_URL}/github-user/${username}`).then(res => res.data)
    }
  }
}
