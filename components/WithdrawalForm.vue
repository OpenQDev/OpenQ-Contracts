<template>
  <div class="card-body">
    <div class="alert alert-success border-0" v-if="showWithdrawalSuccess">
      <button type="button" class="close text-success" @click="showWithdrawalSuccess = false">
        <span>&times;</span>
      </button>
      <CheckIcon width="24px" height="24px" />
      Withdrawal confirmed! :)<br>
      <small>
        We sent 0.5 ETH to you. Also 0.1 MergeCoin were minted and equally split between you and the depositer(s).
      </small>
    </div>
    <div class="alert alert-success border-0" v-if="showRegistrationSuccess">
      <button type="button" class="close text-success" @click="showRegistrationSuccess = false">
        <span>&times;</span>
      </button>
      <CheckIcon width="24px" height="24px" />
      Registration successfull! :)<br>
      <small>
        You can now delete the repository again and start withdrawing funds.
      </small>
    </div>
    <div v-if="registered">
      <small class="text-muted d-flex justify-content-between">
        Pull Request
        <HelpIcon v-tooltip="'Paste the URL of the GitHub pull request you want to withdraw from. The pull request must be merged and submitted by you.'" width="18px" height="18px" class="mb-1 help-icon" />
      </small>
      <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="url" />
    </div>
    <div v-if="loadingContribution || contribution">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loadingContribution" class="text-muted-light" />
      <PullRequestEmbed :contribution="contribution" v-if="contribution" />
    </div>
    <div v-if="connected">
      <div v-if="registered">
        <h2 class="my-3 text-center" v-if="contribution">
          <div v-if="loadingDepositAmount">
            <font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" />
            <small class="d-block text-muted-light"><sup>loading deposit</sup></small>
          </div>
          <div v-else>
            {{ formattedDepositAmount }} ETH
            <small class="d-block text-muted"><sup>deposited</sup></small>
          </div>
        </h2>
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
        <div v-for="(beneficiary, index) in beneficiaries" :key="beneficiaries.address" class="d-flex beneficiary mb-2" v-if="contribution && contribution.merged && githubUser && contribution.user.login === githubUser.login">
          <div class="flex-fill d-flex flex-column align-items-end">
            <input type="text" class="form-control address" placeholder="Address" v-model="beneficiary.address" />
            <div v-if="beneficiary.address">
              <small class="text-muted pr-1" v-if="$web3 && $web3.utils.isAddress(beneficiary.address)">
                <CheckIcon width="12px" height="12px" />
                valid
              </small>
              <small class="text-danger pr-1" v-else>
                not valid
              </small>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end">
            <div class="amount-input amount-input-sm">
              <input type="number" min="0" max="100" step="1" class="form-control percentage" placeholder="0" v-model="beneficiary.percentage" />
              <span>%</span>
            </div>
            <small class="text-muted pr-1">~0.2 ETH</small>
          </div>
          <a href="#" class="btn btn-light mb-auto remove border" @click="removeBeneficiary(beneficiary)">
            <font-awesome-icon :icon="['fas', 'minus']" />
          </a>
        </div>
        <div class="text-center" v-if="!sendingWithdrawal && contribution && contribution.merged && githubUser && contribution.user.login === githubUser.login">
          <h5 class="mb-3 font-weight-bold" v-if="beneficiaries.length">
            {{ formatAmount(totalBeneficiariesAmount) }} ETH<br><small class="text-muted"><sup>goes to beneficiaries.</sup></small>
          </h5>
          <a href="#" class="btn btn-sm btn-light" @click="beneficiaries.push({ address: '', percentage: 0 })">
            <small>
              <font-awesome-icon :icon="['fas', 'plus']" />
              add beneficiary
            </small>
          </a>
        </div>
        <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" @click="withdraw()" :disabled="sendingWithdrawal || !contribution || !contribution.merged || !githubUser || contribution.user.login !== githubUser.login">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="sendingWithdrawal" />
          {{ sendingWithdrawal ? 'Waiting for confirmation...' : 'Confirm' }}
        </button>
        <div v-if="userDeposits.length" class="border-top mt-3 pt-3">
          <div v-for="(deposit, index) in userDeposits" :key="index" class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="mb-0">
                {{ $web3.utils.fromWei(deposit.amount, 'ether') }} ETH
              </h4>
              <small class="text-muted">From: <AddressShort :address="deposit.from" length="medium" /></small>
            </div>
            <button class="btn btn-primary shadow-sm" @click="withdrawUserDeposit(deposit.id)" :disabled="withdrawingUserDeposit != 0">
              <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="withdrawingUserDeposit === deposit.id" />
              {{ withdrawingUserDeposit === deposit.id ? '' : 'Withdraw' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="alert alert-primary border-0">
          <small>
            To withdraw deposits or receive funds through your GitHub username,
            you need to verify your GitHub account by creating a repository
            named after your Ethereum address and then clicking on Register.
            Afterwards you can remove this repository again and also update your
            address at any time.<br>
            <div class="d-flex justify-content-between border border-primary rounded-lg px-2 py-1 mt-2">
              <i class="my-auto">github.com/mktcode/0x27711...9E520</i>
              <span class="p-1"><font-awesome-icon :icon="['far', 'copy']" /></span>
            </div>
          </small>
        </div>
        <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="githubUser" @click="register()" :disabled="loadingRegistration">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loadingRegistration" />
          {{ loadingRegistration ? 'Waiting for confirmation...' : 'Register' }}
        </button>
        <a
          v-else
          :href="'https://github.com/login/oauth/authorize?scope=user:email&client_id=' + githubClientId"
          class="btn btn-lg btn-dark shadow-sm d-block mt-4"
        >
          <font-awesome-icon :icon="['fab', 'github']" />
          Connect
        </a>
      </div>
    </div>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
      Connect
    </button>
  </div>
</template>

<style lang="sass">
.beneficiary
  .address
    border-top-right-radius: 0
    border-bottom-right-radius: 0
  .percentage
    border-radius: 0
    border-left: 0
    border-right: 0
    width: 100px
  .remove
    border-top-left-radius: 0
    border-bottom-left-radius: 0

</style>

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'
import loadFromGithub from '@/mixins/loadFromGithub'

export default {
  mixins: [connect, loadFromGithub],
  data() {
    return {
      githubClientId: process.env.GITHUB_CLIENT_ID,
      loadingRegistration: false,
      showRegistrationSuccess: false,
      url: '',
      loadingContribution: false,
      contribution: null,
      sendingWithdrawal: false,
      showWithdrawalSuccess: false,
      beneficiaries: [],
      depositAmount: 0,
      loadingDepositAmount: false,
      userDeposits: [],
      withdrawingUserDeposit: 0
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      this.contribution = null
      this.depositAmount = 0
      if (newUrl.includes('https://github.com') && newUrl.includes('/pull/')) {
        let urlParts = newUrl.split('/')
        let number = urlParts.pop()
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        this.loadingContribution = true
        this.loadPullRequest(owner, repo, number)
          .then(pr => {
            this.contribution = pr
            this.loadDepositAmount(pr.id)
          })
          .finally(() => this.loadingContribution = false)
      }
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'registered']),
    ...mapGetters("github", { githubUser: 'user' }),
    formattedDepositAmount() {
      return this.depositAmount ? Number(this.$web3.utils.fromWei(this.depositAmount.toString(), "ether")).toFixed(2) : "0.00"
    },
    totalBeneficiariesAmount() {
      let totalPercentage = 0
      this.beneficiaries.forEach(b => totalPercentage += Number(b.percentage))
      return totalPercentage ? this.depositAmount / 100 * totalPercentage : 0
    }
  },
  mounted() {
    this.updateUserDeposits()
  },
  methods: {
    register() {
      this.loadingRegistration = true
      this.$mergePay.methods.register(this.githubUser.login).send({ from: this.account  }).then(result => {
        this.$mergePay.events.RegistrationConfirmedEvent().on('data', event => {
          if (event.returnValues.account === this.account && event.returnValues.githubUser === this.githubUser.login) {
            this.$store.commit("setRegistered", true)
            this.showRegistrationSuccess = true
            this.loadingRegistration = false
          }
        })
      }).catch(() => this.loadingRegistration = false)
    },
    withdraw() {
      this.sendingWithdrawal = true
      setTimeout(() => {
        this.sendingWithdrawal = false
        this.showWithdrawalSuccess = true
        this.contribution = null
        this.depositAmount = 0
        this.url = ''
        this.beneficiaries = []
      }, 2000)
    },
    withdrawUserDeposit(id) {
      this.withdrawingUserDeposit = id
      this.$mergePay.methods.withdrawUserDeposit(id).send({ from: this.account })
        .then(() => this.updateUserDeposits())
        .catch(e => console.log(e))
        .finally(() => this.withdrawingUserDeposit = 0)
    },
    updateUserDeposits() {
      let deposits = []
      this.$mergePay.methods.getDepositIdsForGithubUser(this.githubUser.login).call().then(ids => {
        ids.forEach(id => {
          this.$mergePay.methods._userDeposits(id).call().then(deposit => {
            if (Number(deposit.amount)) {
              deposit.id = id
              deposits.push(deposit)
            }
          })
        })
      })
      this.userDeposits = deposits
    },
    loadDepositAmount(prId) {
      this.loadingDepositAmount = true
      setTimeout(() => {
        this.loadingDepositAmount = false
        this.depositAmount = 5000000000000000000
      }, 3000)
    },
    removeBeneficiary(beneficiary) {
      let existingIndex = this.beneficiaries.findIndex(ben => ben === beneficiary)
      if (existingIndex != -1) {
        this.beneficiaries.splice(existingIndex, 1)
      }
    },
    formatAmount(amount) {
      return Number(this.$web3.utils.fromWei(amount.toString(), "ether")).toFixed(2)
    }
  }
}
</script>
