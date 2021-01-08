import axios from "axios"

export default {
  methods: {
    loadPullRequest(owner, repo, number) {
      return axios.get(`${process.env.API_URL}/github-pullrequest/${owner}/${repo}/${number}`).then(res => res.data)
    },
    loadIssue(owner, repo, number) {
      return axios.get(`${process.env.API_URL}/github-issue/${owner}/${repo}/${number}`).then(res => res.data)
    },
    loadIssueById(issueId) {
      return axios.get(`${process.env.API_URL}/github-issue-by-id/${issueId}`).then(res => res.data)
    },
    loadUser(username) {
      return axios.get(`${process.env.API_URL}/github-user/${username}`).then(res => res.data)
    }
  }
}
