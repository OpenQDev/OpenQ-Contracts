<template>
  <div class="card-body">
    <div v-if="registered">
      <small class="text-muted d-flex justify-content-between">
        Pull Request
        <HelpIcon v-tooltip="'Paste the URL of the GitHub pull request you want to withdraw from. The pull request must be merged and submitted by you.'" width="18px" height="18px" class="mb-1 help-icon" />
      </small>
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="url" />
      <div v-if="loading || contribution">
        <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
        <PullRequestEmbed :contribution="contribution" v-if="contribution" />
      </div>
      <div class="alert alert-warning border-0 mt-2 mb-2" v-if="contribution && githubUser && contribution.user.login !== githubUser.login">
        <font-awesome-icon :icon="['fas', 'info-circle']" />
        <small>
          This pull request does not belong to you.
        </small>
      </div>
      <div class="alert alert-warning border-0 mt-2 mb-2" v-if="contribution && githubUser && !contribution.merged">
        <font-awesome-icon :icon="['fas', 'info-circle']" />
        <small>
          This pull request is not merged yet.
        </small>
      </div>
      <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" :disabled="!contribution || !contribution.merged || !githubUser || contribution.user.login !== githubUser.login">
        Confirm
      </button>
      <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
        Connect
      </button>
    </div>
    <div v-else>
      <div class="alert alert-primary border-0">
        <small>
          To withdraw a deposit for a merged pull request you need to verify your GitHub
          account on the Ethereum blockchain by creating a repository named
          after your address and then clicking on Register.
          Afterwards you can remove this repository again.<br>
          <div class="d-flex justify-content-between border border-primary rounded-lg px-2 py-1 mt-2">
            <i class="my-auto">github.com/mktcode/0x27711...9E520</i>
            <span class="p-1"><font-awesome-icon :icon="['far', 'copy']" /></span>
          </div>
        </small>
      </div>
      <a href="#" class="btn btn-lg btn-primary shadow-sm d-block mt-4" @click="registered = true">
        Register
      </a>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'
import loadFromGithub from '@/mixins/loadFromGithub'

export default {
  mixins: [connect, loadFromGithub],
  data() {
    return {
      registered: false,
      url: '',
      loading: false,
      contribution: null,
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      this.contribution = null
      if (newUrl.includes('https://github.com') && newUrl.includes('/pull/')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        this.loading = true
        this.loadPullRequest(owner, repo, number)
          .then(pr => this.contribution = pr)
          .finally(() => this.loading = false)
      }
    }
  },
  computed: {
    ...mapGetters(['connected']),
    ...mapGetters("github", { githubUser: 'user' }),
  },
}
</script>
