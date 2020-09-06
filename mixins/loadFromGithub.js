import axios from "axios"

export default {
  methods: {
    loadPullRequest(owner, repo, number) {
      return axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`).then(res => res.data)
    },
    loadIssue(owner, repo, number) {
      return axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`).then(res => res.data)
    },
    loadUser(username) {
      return axios.get(`${process.env.API_URL}/github-user/${username}`).then(res => res.data)
    }
  }
}
