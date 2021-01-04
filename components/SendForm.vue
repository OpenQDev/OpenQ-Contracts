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
    <div class="input-with-embed select-input select-input-left">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2 rounded-xl" v-model="recipientString" :placeholder="recipientInputPlaceholder" />
      <span class="btn btn-primary shadow-sm rounded-xl" @click="$store.commit('setShowRecipientTypeList', true)" style="width: 95px">
        <span>{{ selectedRecipientType }}</span>
        <small><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
      </span>
      <a href="#" class="position-absolute text-muted-light" style="top: 12px; right: 50px; z-index: 2" v-if="user" @click="user = null; recipientString = ''">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </a>
      <div v-if="loading || user">
        <div class="text-center mb-2" v-if="loading"><font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" /></div>
        <UserEmbed :user="user" :address="address" v-if="user" class="mb-2" />
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
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4 rounded-xl" v-if="connected" @click="address ? send() : deposit()" :disabled="!user || amount == 0 || sending">
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
import Datepicker from 'vuejs-datepicker'

export default {
  mixins: [connect, loadFromGithub],
  components: { Datepicker },
  data() {
    return {
      recipientString: '',
      address: null,
      loading: false,
      user: null,
      amount: 0,
      lockDays: 0,
      sending: false,
      showSendSuccess: false,
      loadUserTimeout: null,
      accountsUserDeposits: [],
      refundingUserDeposit: 0,
      releaseInstallments: 1,
      showSchedule: false,
      releaseDate: new Date(),
      showDatepicker: false
    }
  },
  mounted() {
    if (this.$route.params.recipient) {
      this.recipientString = this.$route.params.recipient
      this.amount = Number(this.$route.params.amount)
    }
    this.updateUserDeposits()
  },
  watch: {
    account() {
      this.updateUserDeposits()
    },
    recipientString(newUsername, oldUsername) {
      clearTimeout(this.loadUserTimeout)
      this.loadUserTimeout = setTimeout(() => {
        if (newUsername) {
          this.loading = true
          this.user = null
          this.loadUser(newUsername)
            .then(user => {
              this.user = user
              if (this.$octoBay) {
                this.$octoBay.methods.userIDsByGithubUser(newUsername).call().then(userId => {
                  if (userId) {
                    this.$octoBay.methods.users(userId).call().then(result => {
                      if (result.account !== "0x0000000000000000000000000000000000000000" && result.confirmed) {
                        this.address = result.account
                      } else {
                        this.address = null
                      }
                    }).catch(e => console.log(e))
                  } else {
                    this.address = null
                  }
                }).catch(e => console.log(e))
              }
            })
            .catch(() => {
              this.user = null
              this.address = null
            })
            .finally(() => this.loading = false)
        } else {
          this.user = null
          this.address = null
          this.loading = false
        }
      }, 500)
    },
  },
  computed: {
    ...mapGetters(['connected', 'account', 'selectedToken', 'selectedRecipientType', 'selectedInterval']),
    recipientInputPlaceholder() {
      return this.selectedRecipientType == 'User' ? 'Username' : (this.selectedRecipientType == 'Issue' ? 'Issue URL' : 'Repository URL')
    },
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
    }
  },
  methods: {
    send() {
      this.sending = true
      this.$octoBay.methods.sendEthToGithubUser(this.recipientString.toLowerCase()).send({
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
        this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    },
    deposit() {
      this.sending = true
      this.$octoBay.methods.depositEthForGithubUser(this.recipientString.toLowerCase()).send({
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
        this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
        this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
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
      this.$octoBay.methods.refundUserDeposit(id).send({ from: this.account })
        .then(() => {
          this.updateUserDeposits()
          this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
          this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
        })
        .catch(e => console.log(e))
        .finally(() => this.refundingUserDeposit = 0)
    },
    daysBetween(first, second) {
      // Copy date parts of the timestamps, discarding the time parts.
      var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

      // Do the math.
      var millisecondsPerDay = 1000 * 60 * 60 * 24;
      var millisBetween = two.getTime() - one.getTime();
      var days = millisBetween / millisecondsPerDay;

      // Round down.
      return Math.floor(days);
    }
  }
}
</script>
