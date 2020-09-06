<template>
  <div class="card-body">
    <div class="alert alert-success border-0" v-if="showSendSuccess">
      <button type="button" class="close text-success" @click="showSendSuccess = false">
        <span>&times;</span>
      </button>
      <CheckIcon width="24px" height="24px" />
      Transfer confirmed! :)<br>
      <small>
        The GitHub user <a href="#">mktcode</a> will now receive 0.1 ETH once a week.
      </small>
    </div>
    <small class="text-muted d-flex justify-content-between">
      GitHub User
    </small>
    <div class="input-with-embed">
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" v-model="username" />
      <div v-if="loading || user">
        <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loading" class="text-muted-light" />
        <UserEmbed :user="user" v-if="user" />
      </div>
    </div>
    <div class="alert alert-info" v-if="user">
      <div class="mb-2">
        <InfoIcon width="24px" height="24px" />
        This GitHub user is not registered.
      </div>
      <small>
        Registration is requred to receive funds.
        Do you want to cover the registration fee of 0.01 ETH for {{ user.login }}?
        The total amount specified below will be transferred the moment the user registers.
      </small>
    </div>
    <small class="text-muted mb-1">
      Amount
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
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected" @click="sendDeposit()" :disabled="!user || amount == 0 || sending">
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
      loading: false,
      user: null,
      amount: 0,
      lockDays: 0,
      sending: false,
      showSendSuccess: false,
      loadUserTimeout: null
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
          .then(user => this.user = user)
          .catch(() => this.user = null)
          .finally(() => this.loading = false)
        } else {
          this.user = null
          this.loading = false
        }
      }, 500)
    },
  },
  computed: {
    ...mapGetters(['connected']),
  },
  methods: {
    sendDeposit() {
      this.sending = true
      setTimeout(() => {
        this.sending = false
        this.showDepositSuccess = true
        this.url = ''
        this.sourceUrl = ''
        this.contribution = null
        this.sourceContribution = null
        this.type = 0
        this.sourceType = 0
        this.lockDays = 0
        this.amount = 0
      }, 2000)
    }
  }
}
</script>
