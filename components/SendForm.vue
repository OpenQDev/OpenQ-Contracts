<template>
  <div class="card-body" style="max-width: 360px">
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
    <div class="amount-input mb-2">
      <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" v-model="amount" />
      <span>ETH</span>
    </div>
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
      loadUserTimeout: null
    }
  },
  mounted() {
    if (this.$route.params.recipient) {
      this.username = this.$route.params.recipient
      this.amount = Number(this.$route.params.amount)
    }
  },
  watch: {
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
                  if (result.account !== "0x0000000000000000000000000000000000000000" && result.confirmations) {
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
      }).catch(e => {
        console.log(e)
      }).finally(() => {
        this.loading = false
        this.sending = false
      })
    }
  }
}
</script>
