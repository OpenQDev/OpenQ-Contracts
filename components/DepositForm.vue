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
    <small class="text-muted d-flex justify-content-between align-items-end mb-1">
      {{ move ? 'Source deposit' : 'Deposit amount'}}
      <h4 v-if="move" class="text-muted-light"><font-awesome-icon :icon="['fas', 'long-arrow-alt-up']" /></h4>
      <a href="#" class="text-muted font-weight-bold" v-if="move" @click="move = false">new deposit</a>
      <a href="#" class="text-muted font-weight-bold" v-else @click="move = true">move from existing deposit</a>
    </small>
    <div v-if="move">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="sourceUrl" />
      <div class="alert alert-warning" v-if="url && sourceUrl && url == sourceUrl">
        <font-awesome-icon :icon="['fas', 'info-circle']" />
        <small>
          Source is same as target.
        </small>
      </div>
      <div v-else-if="sourceLoading || sourceContribution">
        <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sourceLoading" class="text-muted-light" />
        <IssueEmbed :contribution="sourceContribution" v-if="sourceContribution && sourceType == 1" />
        <PullRequestEmbed :contribution="sourceContribution" v-if="sourceContribution && sourceType == 2" />
      </div>
    </div>
    <div class="amount-input mb-2" v-else>
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
    <!-- <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" @click="sendDeposit()" :disabled="!contribution || ((move && !sourceContribution) || (!move && amount == 0)) || sendingDeposit"> -->
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" @click="sendDeposit()" :disabled="true">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sendingDeposit" />
      {{ sendingDeposit ? 'Waiting for confirmation...' : 'Coming soon!' }}
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
      sourceUrl: '',
      loading: false,
      sourceLoading: false,
      contribution: null,
      sourceContribution: null,
      type: 0,
      sourceType: 0,
      amount: 0,
      lockDays: 0,
      sendingDeposit: false,
      showDepositSuccess: false,
      move: false,
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
    },
    sourceUrl(newUrl, oldUrl) {
      this.sourceContribution = null
      if (newUrl != this.url && newUrl.includes('https://github.com')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        if (newUrl.includes('/issues/')) {
          this.sourceLoading = true
          this.sourceType = 1
          this.loadIssue(owner, repo, number)
            .then(issue => this.sourceContribution = issue)
            .finally(() => this.sourceLoading = false)
        } else if (newUrl.includes('/pull/')) {
          this.sourceLoading = true
          this.sourceType = 2
          this.loadPullRequest(owner, repo, number)
            .then(pr => this.sourceContribution = pr)
            .finally(() => this.sourceLoading = false)
        }
      }
    }
  },
  computed: {
    ...mapGetters(['connected', 'account']),
  },
  methods: {
    sendDeposit() {
      this.sendingDeposit = true
      this.$mergePay.methods.deposit(
        this.type,
        this.contribution.node_id,
        this.lockDays
      ).send({ from: this.account, value: this.$web3.utils.toWei(this.amount, "ether") }).then(tx => {
        this.sendingDeposit = false
        this.showDepositSuccess = true
        this.url = ''
        this.sourceUrl = ''
        this.contribution = null
        this.sourceContribution = null
        this.type = 0
        this.sourceType = 0
        this.lockDays = 0
        this.amount = 0
      })
    }
  },
}
</script>
