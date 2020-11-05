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
        <button class="btn btn-primary shadow-sm" @click="refundUserDeposit(deposit.id)" :disabled="refundingUserDeposit != 0">
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
    <small class="text-muted d-flex justify-content-between">
      GitHub User
    </small>
    <div class="input-with-embed">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" v-model="username" />
      <a href="#" class="position-absolute text-muted-light" style="top: 12px; right: 50px; z-index: 2" v-if="user" @click="username = ''">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </a>
      <div v-if="loading || user">
        <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
        <UserEmbed :user="user" :address="address" v-if="user" />
      </div>
    </div>
    <div class="alert alert-info" v-if="user && address">
      <small>
        You don't need to use MergePay for the transfer! But, if you do, you and the recipient will receive MergeToken.
      </small>
    </div>
    <div class="alert alert-info" v-else-if="user">
      <div class="mb-2">
        <InfoIcon width="24px" height="24px" />
        This GitHub user is not registered.
      </div>
      <small>
        Funds will be held in our smart contract and can be withdrawn by {{ user.login }} once registered.
      </small>
    </div>
    <small class="text-muted mb-1">
      Amount
    </small>
    <form class="amount-input mb-2" novalidate>
      <input type="number" min="0" step="0.01" novalidate class="form-control form-control-lg mb-2" placeholder="0.00" v-model="amount" />
      <span>ETH</span>
    </form>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" @click="address ? send() : deposit()" :disabled="!user || amount == 0 || sending">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sending" />
      {{ sending ? 'Waiting for confirmation...' : 'Confirm' }}
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
      username: '',
      address: null,
      loading: false,
      user: null,
      amount: 0,
      lockDays: 0,
      sending: false,
      showSendSuccess: false,
      loadUserTimeout: null,
      accountsUserDeposits: [],
      refundingUserDeposit: 0
    }
  },
  mounted() {
    if (this.$route.params.recipient) {
      this.username = this.$route.params.recipient
      this.amount = Number(this.$route.params.amount)
    }
    this.updateUserDeposits()
  },
  watch: {
    account() {
      this.updateUserDeposits()
    },
    username(newUsername, oldUsername) {
      clearTimeout(this.loadUserTimeout)
      this.loadUserTimeout = setTimeout(() => {
        if (newUsername) {
          this.loading = true
          this.user = null
          this.loadUser(newUsername)
            .then(user => {
              this.user = user
              if (this.$mergePay) {
                this.$mergePay.methods._users(newUsername).call().then(result => {
                  if (result.account !== "0x0000000000000000000000000000000000000000" && result.confirmed) {
                    this.address = result.account
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
    ...mapGetters(['connected', 'account']),
  },
  methods: {
    send() {
      this.sending = true
      this.$mergePay.methods.sendEthToGithubUser(this.username).send({
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    },
    deposit() {
      this.sending = true
      this.$mergePay.methods.depositEthForGithubUser(this.username).send({
        from: this.account,
        value: this.$web3.utils.toWei(this.amount, "ether")
      }).then(result => {
        this.amount = 0
        this.showSendSuccess = true
        this.updateUserDeposits()
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    },
    updateUserDeposits() {
      let accountsDeposits = []
      if (this.$mergePay) {
        this.$mergePay.methods.getUserDepositIdsForSender().call({ from: this.account }).then(ids => {
          ids.forEach(id => {
            this.$mergePay.methods._userDeposits(id).call().then(deposit => {
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
      this.$mergePay.methods.refundUserDeposit(id).send({ from: this.account })
        .then(() => this.updateUserDeposits())
        .catch(e => console.log(e))
        .finally(() => this.refundingUserDeposit = 0)
    },
  }
}
</script>
