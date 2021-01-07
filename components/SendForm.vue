<template>
  <div class="card-body" style="max-width: 360px">
    <div v-if="accountsUserDeposits.length" class="border-bottom mb-4 pb-2">
      <small class="text-muted d-block text-center border-bottom pb-2 mb-2">Pending withdrawals:</small>
      <div v-for="(deposit, index) in accountsUserDeposits" :key="index" class="d-flex justify-content-between align-items-center">
        <div class="d-flex flex-column">
          <h4 class="mb-0">
            {{ Number($web3.utils.fromWei(deposit.amount, 'ether')).toFixed(2) }} <small>ETH</small>
          </h4>
          <small class="text-muted">
            &gt;
            <a :href="'https://github.com/' + deposit.githubUser" target="_blank">
              {{ deposit.githubUser }}
            </a>
          </small>
        </div>
        <button class="btn btn-primary shadow-sm rounded-xl" @click="refundUserDeposit(deposit.id)" :disabled="refundingUserDeposit != 0">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="refundingUserDeposit === deposit.id" />
          {{ refundingUserDeposit === deposit.id ? '' : 'cancel' }}
        </button>
      </div>
    </div>
    <div class="alert alert-success border-0" v-if="showSendSuccess">
      <button type="button" class="close text-success" @click="showSendSuccess = false">
        <span>&times;</span>
      </button>
      <CheckIcon width="24px" height="24px" />
      Transfer confirmed! :)
    </div>
    <div class="input-with-embed select-input select-input-left" v-if="selectedRecipientType == 'User'">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2 rounded-xl" style="padding-right: 5rem" v-model="username" placeholder="Username" />
      <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowRecipientTypeList', true)" style="width: 95px">
        <span>User</span>
        <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
      </span>
      <a href="#" class="position-absolute text-muted-light" style="top: 12px; right: 50px; z-index: 2" v-if="user" @click="user = null; username = ''">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </a>
      <div v-if="loading || user">
        <div class="text-center mb-2" v-if="loading"><font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" /></div>
        <UserEmbed :user="user" :address="userEthAddress" v-if="user" class="mb-2" />
      </div>
    </div>
    <div class="input-with-embed select-input select-input-left" v-if="selectedRecipientType == 'Issue'">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2 rounded-xl pr-5" v-model="issueUrl" placeholder="Issue URL" />
      <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowRecipientTypeList', true)" style="width: 95px">
        <span>Issue</span>
        <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
      </span>
      <a href="#" class="position-absolute text-muted-light" style="top: 12px; right: 10px; z-index: 2" v-if="issue" @click="issue = null; issueUrl = ''">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </a>
      <div v-if="loading || issue">
        <div class="text-center mb-2" v-if="loading"><font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" /></div>
        <IssueEmbed :issue="issue" v-if="issue" />
        <div v-if="issue" class="border rounded-xl mt-3 px-3 pt-2" style="margin-bottom: -48px; padding-bottom: 52px">
          <small class="d-block font-weight-bold text-muted text-center">Available repository funds:</small>
          <div class="d-flex justify-content-between mb-1">
            <span>
              <img src="/eth-logo.png" width="18" height="18" class="rounded-circle" />
              ETH
            </span>
            <span>
              <span v-if="selectedToken == null">{{ (5.31 - amount).toFixed(3) }}</span>
              <span v-else>5.31</span>
              <button class="btn btn-sm btn-primary shadow-sm rounded-xl" @click="$store.commit('setSelectedToken', null); amount = 5.31">use</button>
            </span>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span>
              <img src="https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png?1547034700" width="18" height="18" class="rounded-circle" />
              LINK
            </span>
            <span>
              <span v-if="selectedToken && selectedToken.symbol == 'LINK'">{{ (28.46 - amount).toFixed(3) }}</span>
              <span v-else>28.46</span>
              <button class="btn btn-sm btn-primary shadow-sm rounded-xl" @click="$store.commit('setSelectedToken', token('LINK')); amount = 28.46">use</button>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="input-with-embed select-input select-input-left" v-if="selectedRecipientType == 'Project'">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2 rounded-xl pr-5" v-model="repositoryUrl" placeholder="Repository URL" />
      <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowRecipientTypeList', true)" style="width: 95px">
        <span>Project</span>
        <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
      </span>
      <a href="#" class="position-absolute text-muted-light" style="top: 12px; right: 10px; z-index: 2" v-if="repository" @click="repository = null; repositoryUrl = ''">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </a>
      <div v-if="loading || repository">
        <div class="text-center mb-2" v-if="loading"><font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" /></div>
        <RepositoryEmbed :repository="repository" v-if="repository" />
      </div>
    </div>
    <div class="select-input mb-2">
      <input type="number" min="0" step="0.01" novalidate class="form-control form-control-lg mb-2 rounded-xl" placeholder="0.00" v-model="amount" />
      <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowTokenList', true)">
        <span v-if="selectedToken">{{ selectedToken.symbol }}</span>
        <span v-else>ETH</span>
        <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
      </span>
    </div>
    <div>
      <div class="text-center">
        <button class="btn btn-outline-primary btn-sm rounded-xl font-weight-bold px-3" @click="showSchedule = !showSchedule">
          schedule
          <small><font-awesome-icon :icon="['fas', showSchedule ? 'times' : 'chevron-down']" style="opacity: 0.5" /></small>
        </button>
      </div>
      <transition name="fade">
        <div v-if="showSchedule">
          <div class="d-flex align-items-center mt-2">
            <div class="select-input w-50">
              <input type="number" min="1" step="1" novalidate class="form-control form-control-lg rounded-xl" placeholder="0" v-model="releaseInstallments" />
              <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowIntervalSelect', true)" v-if="releaseInstallments > 1">
                <span>{{ selectedInterval }}</span>
                <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
              </span>
              <span class="btn btn-primary rounded-xl disabled" v-else>
                <span>payment</span>
              </span>
            </div>
            <div class="text-nowrap ml-2 d-flex flex-fill flex-column align-items-center border rounded-xl">
              <div class="font-weight-bold">
                {{ amountPerInstallment.toFixed(3) }}
                <span v-if="selectedToken">{{ selectedToken.symbol }}</span>
                <span v-else>ETH</span>
              </div>
              <small class="text-muted" style="margin-top: -5px">
                {{ releaseInstallments > 1 ? 'each' : 'once' }}
              </small>
            </div>
          </div>
          <small class="mt-2 px-2 d-flex text-muted text-center" v-if="selectedRecipientType == 'Issue'">
            Schedule starts once the project maintainer released the issue deposits.
          </small>
          <div class="mt-2" v-else>
            <div class="select-input">
              <input type="text" readonly novalidate class="form-control form-control-lg rounded-xl border bg-white" placeholder="0" :value="formattedReleaseDate" />
              <span class="btn btn-primary shadow-sm rounded-xl" @click="showDatepicker = !showDatepicker">
                <small><font-awesome-icon :icon="['far', 'calendar-alt']" /></small>
              </span>
            </div>
            <transition name="fade">
              <datepicker
                class="mt-2"
                maximum-view="month"
                :inline="true"
                :disabled-dates="{ to: minReleaseDate }"
                v-model="releaseDate"
                v-if="showDatepicker"
                @selected="showDatepicker = false"
              ></datepicker>
            </transition>
          </div>
        </div>
      </transition>
    </div>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4 rounded-xl" v-if="connected" @click="confirm()" :disabled="confirmDisabled">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sending" />
      {{ sending ? 'Waiting for confirmation...' : 'Confirm' }}
    </button>
    <button class="btn btn-lg rounded-xl btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
      Connect
    </button>
  </div>
</div>
</template>

<style lang="sass">
.vdp-datepicker
  .vdp-datepicker__calendar
    width: 100%
    border: none
    header
      .up,
      .prev,
      .next
        border-radius: 2rem
        text-indent: 0
      .prev:after,
      .next:after,
        border: none
    .day:not(.blank):not(.disabled),
    .month:not(.blank):not(.disabled)
      border-radius: 2rem
      &:hover
        border-color: #0366d6 !important
      &.selected
        background: #0366d6
        color: #fff
        &:hover
          background: #0366d6

</style>

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'
import loadFromGithub from '@/mixins/loadFromGithub'
import helpers from '@/mixins/helpers'
import Datepicker from 'vuejs-datepicker'

export default {
  mixins: [connect, loadFromGithub, helpers],
  components: { Datepicker },
  data() {
    return {
      username: '',
      user: null,
      userEthAddress: null,
      issueUrl: '',
      issue: null,
      repositoryUrl: '',
      repository: null,
      loading: false,
      amount: 0,
      sending: false,
      showSendSuccess: false,
      loadRecipientTimeout: null,
      accountsUserDeposits: [],
      refundingUserDeposit: 0,
      releaseInstallments: 1,
      showSchedule: false,
      releaseDate: new Date(),
      showDatepicker: false
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'selectedToken', 'selectedRecipientType', 'selectedInterval', 'tokenList', 'redirectPrefills']),
    amountPerInstallment() {
      if (this.releaseInstallments) {
        return this.amount / this.releaseInstallments
      }
      return this.amount
    },
    minReleaseDate() {
      const date = new Date()
      return new Date(date.setDate( date.getDate() - 1))
    },
    formattedReleaseDate() {
      const prefix = this.releaseInstallments > 1 ? 'Starts: ' : 'Date: '
      const date = this.daysBetween(new Date(), this.releaseDate) === 0 ? 'now' : this.$moment(this.releaseDate).format('MMM. Do YYYY')
      return prefix + date
    },
    confirmDisabled() {
      if (!this.sending && this.amount > 0) {
        if (this.selectedRecipientType == 'User' && this.user) {
          return false
        }
        if (this.selectedRecipientType == 'Issue' && this.issue) {
          return false
        }
        if (this.selectedRecipientType == 'Project' && this.repository) {
          return false
        }
      }
      return true
    }
  },
  mounted() {
    if (this.redirectPrefills) {
      if (this.redirectPrefills.type == 'send-user') {
        this.$store.commit('setSelectedRecipientType', 'User')
        this.username = this.redirectPrefills.username
        this.amount = this.redirectPrefills.amount
      } else if (this.redirectPrefills.type == 'send-repository') {
        this.$store.commit('setSelectedRecipientType', 'Project')
        this.repositoryUrl = `https://github.com/${this.redirectPrefills.username}/${this.redirectPrefills.repository}`
        this.amount = this.redirectPrefills.amount
      } else if (this.redirectPrefills.type == 'send-issue') {
        this.$store.commit('setSelectedRecipientType', 'Issue')
        this.issueUrl = `https://github.com/${this.redirectPrefills.username}/${this.redirectPrefills.repository}/issues/${this.redirectPrefills.issue}`
        this.amount = this.redirectPrefills.amount
      }
    }
    this.updateUserDeposits()
  },
  watch: {
    account() {
      this.updateUserDeposits()
    },
    username(username) {
      clearTimeout(this.loadRecipientTimeout)
      this.loadRecipientTimeout = setTimeout(() => {
        if (username.match(/^[\w\-]+$/)) {
          this.loading = true
          this.user = null
          this.loadUser(username).then(user => {
            this.user = user
            if (this.user && this.$octoBay) {
              this.$octoBay.methods.userIDsByGithubUser(username).call().then(userId => {
                if (userId) {
                  this.$octoBay.methods.users(userId).call().then(result => {
                    if (result.ethAddress !== "0x0000000000000000000000000000000000000000" && result.status == 2) {
                      this.userEthAddress = result.ethAddress
                    } else {
                      this.userEthAddress = null
                    }
                  }).catch(e => console.log(e))
                } else {
                  this.userEthAddress = null
                }
              }).catch(e => console.log(e))
            } else {
              this.ethAddress = null
            }
          })
          .catch(() => {
            this.user = null
            this.userEthAddress = null
          })
          .finally(() => this.loading = false)
        } else {
          this.user = null
          this.userEthAddress = null
          this.loading = false
        }
      }, 500)
    },
    issueUrl(url) {
      clearTimeout(this.loadRecipientTimeout)
      this.loadRecipientTimeout = setTimeout(() => {
        const parts = url.match(/^https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)\/issues\/(\d+)$/)
        if (parts) {
          let owner = parts[1]
          let repo = parts[2]
          let number = parts[3]
          this.loading = true
          this.issue = null
          this.$axios.$get(`${process.env.API_URL}/github-issue/${owner}/${repo}/${number}`).then(issue => {
            this.issue = issue
          })
          .catch(() => {
            this.issue = null
          })
          .finally(() => this.loading = false)
        } else {
          this.issue = null
          this.loading = false
        }
      }, 500)
    },
    repositoryUrl(url) {
      clearTimeout(this.loadRecipientTimeout)
      this.loadRecipientTimeout = setTimeout(() => {
        const parts = url.match(/^https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)$/)
        if (parts) {
          let owner = parts[1]
          let repo = parts[2]
          this.loading = true
          this.repository = null
          this.$axios.$get(`${process.env.API_URL}/github-repository/${owner}/${repo}`).then(repository => {
            this.repository = repository
          })
          .catch(() => {
            this.repository = null
          })
          .finally(() => this.loading = false)
        } else {
          this.repository = null
          this.loading = false
        }
      }, 500)
    },
  },
  methods: {
    confirm() {
      if (this.selectedRecipientType == 'User') {
        if (this.userEthAddress) {
          this.sendToUser()
        } else {
          this.depositForUser()
        }
      } else if (this.selectedRecipientType == 'Issue') {
        this.depositForIssue()
      }
    },
    sendToUser() {
      this.sending = true
      this.$octoBay.methods.sendEthToGithubUser(this.user.login.toLowerCase()).send({
        useGSN: false,
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
        this.$store.dispatch('updateOctoPinBalance')
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    },
    depositForUser() {
      this.sending = true
      this.$octoBay.methods.depositEthForGithubUser(this.user.login.toLowerCase()).send({
        useGSN: false,
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
        this.$store.dispatch('updateOctoPinBalance')
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    },
    depositForIssue() {
      this.sending = true
      this.$octoBay.methods.depositEthForIssue(
        this.issue.id
      ).send({
        useGSN: false,
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(tx => {
        this.$store.dispatch('updateIssues')
        this.$store.dispatch('updateOctoPinBalance')
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
        this.sending = false
        this.showDepositSuccess = true
        this.amount = 0
      })
    },
    updateUserDeposits() {
      let accountsDeposits = []
      if (this.$octoBay) {
        this.$octoBay.methods.getUserDepositIdsForSender().call({ from: this.account }).then(ids => {
          ids.forEach(id => {
            this.$octoBay.methods.userDeposits(id).call().then(deposit => {
              if (Number(deposit.amount)) {
                deposit.id = id
                accountsDeposits.push(deposit)
              }
            })
          })
        })
      }
      this.accountsUserDeposits = accountsDeposits
    },
    refundUserDeposit(id) {
      this.refundingUserDeposit = id
      this.$octoBay.methods.refundUserDeposit(id).send({
        useGSN: false,
        from: this.account
      }).then(() => {
        this.updateUserDeposits()
        this.$store.dispatch('updateOctoPinBalance')
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
      })
      .catch(e => console.log(e))
      .finally(() => this.refundingUserDeposit = 0)
    },
    token(symbol) {
      return this.tokenList.tokens.find(token => token.symbol === symbol)
    }
  }
}
</script>
