<template>
  <div class="card-body">
    <div class="alert alert-success border-0" v-if="showDepositSuccess">
      <button type="button" class="close text-success" @click="showDepositSuccess = false">
        <span>&times;</span>
      </button>
      <CheckIcon width="24px" height="24px" />
      Deposit confirmed! :)<br>
      <small>
        See all your deposits <nuxt-link to="/deposits">here</nuxt-link>. You can withdraw any deposit at any time.
      </small>
    </div>
    <small class="text-muted d-flex justify-content-between">
      Issue or Pull Request
      <HelpIcon v-tooltip="'Paste the URL of the GitHub issue or pull request you want to deposit into.'" width="18px" height="18px" class="mb-1" />
    </small>
    <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="url" />
    <div v-if="loading || contribution">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
      <IssueEmbed :contribution="contribution" v-if="contribution && type == 1" />
      <PullRequestEmbed :contribution="contribution" v-if="contribution && type == 2" />
    </div>
    <small class="text-muted">
      Deposit amount
    </small>
    <div class="amount-input mb-2">
      <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" v-model="amount" />
      <span>ETH</span>
    </div>
    <small class="text-muted d-flex justify-content-between">
      Lock up (optional, max. 180)
      <HelpIcon v-tooltip="'Lock up deposits to shows commitment to contributors, rank higher in listings and earn merge coins to promote your projects. <a href=\'#\' target=\'_blank\'>learn more</a>'" width="18px" height="18px" class="mb-1" />
    </small>
    <div class="amount-input mb-2">
      <input type="number" class="form-control form-control-lg mb-2" min="0" max="180" step="1" placeholder="0" v-model="lockDays" />
      <span>Days</span>
    </div>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" @click="sendDeposit()" :disabled="!contribution || amount == 0 || sendingDeposit">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sendingDeposit" />
      {{ sendingDeposit ? 'Waiting for confirmation...' : 'Confirm' }}
    </button>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
      Connect
    </button>
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
      url: '',
      loading: false,
      contribution: null,
      type: 0,
      amount: 0,
      lockDays: 0,
      sendingDeposit: false,
      showDepositSuccess: false
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      this.contribution = null
      if (newUrl.includes('https://github.com')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
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
            .then(pr => this.contribution = pr)
            .finally(() => this.loading = false)
        }
      }
    }
  },
  computed: {
    ...mapGetters(['connected']),
  },
  methods: {
    sendDeposit() {
      this.sendingDeposit = true
      setTimeout(() => {
        this.sendingDeposit = false
        this.showDepositSuccess = true
        this.url = ''
        this.contribution = null
        this.type = 0
        this.lockDays = 0
        this.amount = 0
      }, 2000)
    }
  }
}
</script>
