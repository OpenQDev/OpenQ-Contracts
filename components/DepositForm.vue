<template>
  <div>
    <transition name="fade" mode="out-in">
      <a href="#" class="btn btn-block btn-lg rounded-xl btn-primary shadow-sm" @click="open = !open" v-if="!open">
        Deposit
      </a>
      <div v-if="open" class="position-relative">
        <a href="#" class="position-absolute text-muted-light text-right" style="top: -10px; right: 0" @click="open = !open">
          <svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </a>
        <small class="text-muted d-flex justify-content-between">
          Issue URL
        </small>
        <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="url" />
        <div v-if="loading || contribution">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
          <IssueEmbed :contribution="contribution" v-if="contribution" />
        </div>
        <small class="text-muted d-flex justify-content-between align-items-end mb-1">
          {{ move ? 'Source deposit' : 'Deposit amount'}}
          <!-- <h4 v-if="move" class="text-muted-light"><font-awesome-icon :icon="['fas', 'long-arrow-alt-up']" /></h4>
          <a href="#" class="text-muted font-weight-bold" v-if="move" @click="move = false">new deposit</a>
          <a href="#" class="text-muted font-weight-bold" v-else @click="move = true">move from existing deposit</a> -->
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
            <IssueEmbed :contribution="sourceContribution" v-if="sourceContribution" />
          </div>
        </div>
        <div class="amount-input mb-2" v-else>
          <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" v-model="amount" />
          <span>ETH</span>
        </div>
        <!-- <small class="text-muted d-flex justify-content-between">
          Lock deposit
          <HelpIcon v-tooltip="'By locking up your deposit you get 1% of your deposit in merge tokens once the deposit got released.<br><a href=\'#\' target=\'_blank\'>Learn more</a>'" width="18px" height="18px" class="mb-1" />
        </small>
        <div class="amount-input mb-2">
          <select class="form-control form-control-lg mb-2" v-model="lock">
            <option value="none">no</option>
            <option value="closed">until issue is closed</option>
            <option value="closed">until released by project owner</option>
          </select>
        </div> -->
        <button class="btn btn-lg rounded-xl btn-primary shadow-sm d-block w-100 mt-4 mb-2" v-if="connected" @click="sendDeposit()" :disabled="!contribution || ((move && !sourceContribution) || (!move && amount == 0)) || sendingDeposit">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sendingDeposit" />
          {{ sendingDeposit ? 'Waiting for confirmation...' : 'Confirm' }}
        </button>
        <button class="btn btn-lg rounded-xl btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
          Connect
        </button>
      </div>
    </transition>
    <div class="alert alert-success border-0 mt-3 mb-0" v-if="showDepositSuccess">
      <button type="button" class="close text-success" @click="showDepositSuccess = false">
        <svg style="width:20px;height:20px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </button>
      <CheckIcon width="24px" height="24px" />
      Deposit confirmed! :)<br>
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
      amount: 0,
      lock: 'none',
      sendingDeposit: false,
      showDepositSuccess: false,
      move: false,
      open: false
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      this.contribution = null
      if (newUrl.includes('https://github.com') && newUrl.includes('/issues/')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        this.loading = true
        this.loadIssue(owner, repo, number)
          .then(issue => this.contribution = issue)
          .finally(() => this.loading = false)
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
          this.loadIssue(owner, repo, number)
            .then(issue => this.sourceContribution = issue)
            .finally(() => this.sourceLoading = false)
        } else if (newUrl.includes('/pull/')) {
          this.sourceLoading = true
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
      this.$octoBay.methods.depositEthForIssue(
        this.contribution.id
      ).send({ from: this.account, value: this.$web3.utils.toWei(this.amount, "ether") }).then(tx => {
        this.$store.dispatch('updateIssues')
        this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
        this.sendingDeposit = false
        this.showDepositSuccess = true
        this.url = ''
        this.sourceUrl = ''
        this.contribution = null
        this.sourceContribution = null
        this.lock = 'none'
        this.amount = 0
        this.open = false
      })
    }
  },
}
</script>
