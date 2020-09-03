<template>
  <div class="card-body">
    <small class="text-muted d-flex justify-content-between">
      Issue or Pull Request
      <HelpIcon v-tooltip="'Paste the URL of the GitHub issue or pull request you want to deposit into.'" width="18px" height="18px" class="mb-1" />
    </small>
    <input type="text" class="form-control form-control-lg mb-2" placeholder="https://github.com/..." v-model="url" />
    <div v-if="loading || contribution">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
      <IssueEmbed :contribution="contribution" v-if="contribution && type == 1" />
      <PullRequestEmbed :contribution="contribution" v-if="contribution && type == 2" />
    </div>
    <small class="text-muted">
      Deposit amount
    </small>
    <div class="amount-input mb-2">
      <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" />
      <span>ETH</span>
    </div>
    <small class="text-muted d-flex justify-content-between">
      Lock up (optional, max. 180)
      <HelpIcon v-tooltip="'Lock up deposits to shows commitment to contributors, rank higher in listings and earn merge coins to promote your projects. <a href=\'#\' target=\'_blank\'>learn more</a>'" width="18px" height="18px" class="mb-1" />
    </small>
    <div class="amount-input mb-2">
      <input type="number" class="form-control form-control-lg mb-2" min="0" max="180" step="1" placeholder="0" />
      <span>Days</span>
    </div>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" :disabled="!contribution">
      Confirm
    </button>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
      Connect
    </button>
  </div>
</div>
</template>

<style lang="sass">
.form-control
  position: relative
  z-index: 2
</style>

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'
import loadFromGithub from '@/mixins/loadFromGithub'

export default {
  mixins: [connect, loadFromGithub],
  data() {
    return {
      url: '',
      loading: false,
      contribution: null,
      type: 0,
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      if (newUrl.includes('https://github.com')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        this.contribution = null
        if (newUrl.includes('/issues/')) {
          this.loading = true
          this.type = 1
          this.loadIssue(owner, repo, number)
            .then(issue => this.contribution = issue)
            .finally(() => this.loading = false)
        } else if (newUrl.includes('/pull/')) {
          this.loading = true
          this.type = 2
          this.loadPullRequest(owner, repo, number)
            .then(pr => {this.contribution = pr; console.log(pr)})
            .finally(() => this.loading = false)
        } else {
          this.contribution = null
        }
      } else {
        this.contribution = null
      }
    }
  },
  computed: {
    ...mapGetters(['connected']),
  },
}
</script>
