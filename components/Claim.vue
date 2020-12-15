<template>
  <div class="card-body">
    <div class="alert alert-success border-0" v-if="showClaimSuccess">
      <button type="button" class="close text-success" @click="showClaimSuccess = false">
        <span>&times;</span>
      </button>
      <font-awesome-icon :icon="['far', 'smile']" />
      Claim successful!
    </div>
    <div class="alert alert-danger border-0" v-if="showClaimError">
      <button type="button" class="close text-danger" @click="showClaimError = false">
        <span>&times;</span>
      </button>
      <font-awesome-icon :icon="['far', 'frown']" />
      Claim failed!<br>
      <small>
        Please make sure your pull request is valid. It must be for a repository you don't have administrative rights for and merged not longer than {{ maxClaimPrAge }} days ago.
        If you did, the problem might be on our side.
        Please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
    </div>
    <div class="alert alert-success border-0" v-if="showWithdrawalSuccess">
      <button type="button" class="close text-success" @click="showWithdrawalSuccess = false">
        <span>&times;</span>
      </button>
      <font-awesome-icon :icon="['far', 'smile']" />
      Withdrawal successful!
    </div>
    <div class="alert alert-success border-0" v-if="showRegistrationSuccess">
      <button type="button" class="close text-success" @click="showRegistrationSuccess = false">
        <span>&times;</span>
      </button>
      <font-awesome-icon :icon="['far', 'smile']" />
      Registration successfull! :)<br>
      <small>
        You can now delete the repository again and start claiming funds.
      </small>
    </div>
    <div class="alert alert-danger border-0" v-if="showRegistrationError">
      <button type="button" class="close text-danger" @click="showRegistrationError = 0">
        <span>&times;</span>
      </button>
      <font-awesome-icon :icon="['far', 'frown']" />
      Registration failed!<br>
      <small v-if="showRegistrationError == 1">
        We were able to confirm that you are the owner of the right repository but sending the confirmation to the Ethereum blockchain failed. Wait a moment and click on "Retry".
        If the problem still occurs, please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
      <small v-if="showRegistrationError == 2">
        It seems you did not create the repository with your address as its name. You can create the repository and then click on "Retry".
        If you did and the error still occurs, please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
      <small v-if="showRegistrationError == 3">
        It seems there was a problem with the GitHub API. Check if GitHub is currently available, wait a moment and then click on "Retry".
        If the error still occurs, please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
      <small v-if="showRegistrationError == 4">
        It seems this GitHub account is already registered. If you forgot the Ethereum address you connected to this GitHub account, simply go to the send page and enter your account name.
        If you still have problems, please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
      <small v-if="showRegistrationError == 5">
        It seems there was a problem with the Ethereum network. Please wait a moment and click on "Retry".
        If the problem still occurs, please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
      </small>
      <div class="text-center mt-2" v-if="[1,2,3,5].includes(showRegistrationError)">
        <button class="btn btn-sm btn-primary" @click="registerRetry()">Retry</button>
      </div>
    </div>
    <div v-if="connected">
      <div v-if="registeredAccount === account">
        <small class="text-muted d-flex justify-content-between">
          Pull Request or Issue URL
          <HelpIcon v-tooltip="'Paste the URL of a merged pull request to claim OctoPin tokens or an issue you want to withdraw a deposit from.'" width="18px" height="18px" class="mb-1 help-icon" />
        </small>
        <input type="text" class="form-control form-control-lg form-control-with-embed mb-2" placeholder="https://github.com/..." v-model="url" />
        <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loadingContribution" class="text-muted-light" />
        <PullRequestEmbed :contribution="contribution" v-else-if="contribution && type == 'pr'" />
        <IssueEmbed :contribution="contribution" v-else-if="contribution && type == 'issue'" />

        <div v-if="contribution && type == 'pr'">
          <div class="alert alert-warning border-0 mt-2 mb-2" v-if="githubUser && contribution.owner.login === githubUser.login">
            <font-awesome-icon :icon="['fas', 'info-circle']" />
            <small>
              You can only claim pull requests for repositories that are not your own.
            </small>
          </div>
          <div class="alert alert-warning border-0 mt-2 mb-2" v-if="githubUser && contribution.pullRequest.author.login !== githubUser.login">
            <font-awesome-icon :icon="['fas', 'info-circle']" />
            <small>
              This pull request does not belong to you.
            </small>
          </div>
          <div class="alert alert-warning border-0 mt-2 mb-2" v-if="githubUser && !contribution.pullRequest.merged">
            <font-awesome-icon :icon="['fas', 'info-circle']" />
            <small>
              This pull request is not merged yet.
            </small>
          </div>
          <div class="alert alert-warning border-0 mt-2 mb-2" v-if="githubUser && getAge(contribution.pullRequest.mergedAt) > maxClaimPrAge">
            <font-awesome-icon :icon="['fas', 'info-circle']" />
            <small>
              Only pull request merged inside the last {{ maxClaimPrAge }} days can be claimed.
            </small>
          </div>
          <div class="text-center">
            <small class="text-muted">Score:</small>
            <h3>{{ score }}</h3>
          </div>
        </div>

        <div v-if="contribution && type == 'issue'">
          <div class="text-center">
            <small class="text-muted">Amount:</small>
            <h3>{{ issueDepositsAmount.toFixed(2) }} ETH</h3>
          </div>
          <div class="alert alert-warning border-0 mt-2 mb-2" v-if="githubUser && githubUser.login != issueReleasedTo">
            <font-awesome-icon :icon="['fas', 'info-circle']" />
            <small>
              This issue was not released to you.
            </small>
          </div>
        </div>

        <button v-if="type === 'issue'" class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" @click="withdrawFromIssue()" :disabled="withdrawingFromIssue || !contribution || !githubUser || !issueDepositsAmount || githubUser.login != issueReleasedTo">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="withdrawingFromIssue" />
          {{ withdrawingFromIssue ? 'Waiting for confirmation...' : 'Claim' }}
        </button>
        <button v-if="type === 'pr'" class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" @click="claimPullRequest()" :disabled="claimingPullRequest || !contribution || !contribution.pullRequest.merged || !githubUser || contribution.pullRequest.author.login !== githubUser.login || getAge(contribution.pullRequest.mergedAt) > maxClaimPrAge || contribution.owner.login === githubUser.login">
          <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="claimingPullRequest" />
          {{ claimingPullRequest ? 'Waiting for confirmation...' : 'Claim' }}
        </button>

        <div v-if="userDeposits.length" class="border-top mt-3 pt-3">
          <div v-for="(deposit, index) in userDeposits" :key="index" class="d-flex justify-content-between align-items-center">
            <div class="d-flex flex-column">
              <h4 class="mb-0">
                {{ $web3.utils.fromWei(deposit.amount, 'ether') }} ETH
              </h4>
              <small class="text-muted">
                From: <a href="#">mktcode</a>
              </small>
              <small class="text-muted" style="margin-top: -3px">
                <AddressShort :address="deposit.from" />
              </small>
            </div>
            <button class="btn btn-primary shadow-sm" @click="withdrawUserDeposit(deposit.id)" :disabled="withdrawingUserDeposit != 0">
              <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="withdrawingUserDeposit === deposit.id" />
              {{ withdrawingUserDeposit === deposit.id ? '' : 'Withdraw' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="alert alert-primary border-0 mb-0">
          <small>
            To withdraw deposits or receive funds with your GitHub account,
            you need to verify your account by creating a repository
            named after your Ethereum address and then registering below.
            Afterwards you can remove this repository again and also update your
            address at any time.
            <div v-if="!githubUser" class="mt-3">Connect to your GitHub account first to register.</div>
          </small>
        </div>
        <div v-if="githubUser">
          <div class="d-flex justify-content-between align-items-center btn btn-light mt-2" v-clipboard="account" v-clipboard:success="copiedAddress">
            <transition name="fade" mode="out-in">>
              <font-awesome-icon :icon="['fas', 'check']" class="text-success" v-if="copyAddressSuccess" key="check" />
              <font-awesome-icon :icon="['far', 'copy']" v-else key="copy" />
            </transition>
            <i class="my-auto"><AddressShort :address="account" length="medium" /></i>
            <i></i>
          </div>
          <a href="https://github.com/new" target="_blank" class="d-flex justify-content-between align-items-center btn btn-dark btn-block mt-2">
            <font-awesome-icon :icon="['fab', 'github']" />
            Create Repository
            <i></i>
          </a>
        </div>
        <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-3" v-if="githubUser" @click="register()" :disabled="loadingRegistration">
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

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'
import loadFromGithub from '@/mixins/loadFromGithub'

export default {
  mixins: [connect, loadFromGithub],
  data() {
    return {
      githubClientId: process.env.GITHUB_CLIENT_ID,
      maxClaimPrAge: process.env.MAX_CLAIMPR_AGE,
      url: '',
      type: null,
      loadingContribution: false,
      contribution: null,
      loadingRegistration: false,
      showRegistrationSuccess: false,
      showRegistrationError: 0,
      score: 0,
      withdrawingFromIssue: false,
      showWithdrawalSuccess: false,
      userDeposits: [],
      withdrawingUserDeposit: 0,
      claimingPullRequest: false,
      showClaimSuccess: false,
      showClaimError: false,
      issueDepositsAmount: 0,
      issueReleasedTo: '',
      copyAddressSuccess: false,
    }
  },
  watch: {
    url(newUrl, oldUrl) {
      this.contribution = null
      // TODO: use regex here
      if (newUrl.includes('https://github.com')) {
        let urlParts = newUrl.split('/')
        let number = Number(urlParts.pop())
        urlParts.pop()
        let repo = urlParts.pop()
        let owner = urlParts.pop()
        if (newUrl.includes('/pull/') && number) {
          this.type = 'pr'
          this.loadingContribution = true
          this.loadPullRequest(owner, repo, number, this.githubAccessToken)
            .then(repo => {
              this.contribution = repo
              this.score = this.calculatePRScore(repo)
            })
            .finally(() => this.loadingContribution = false)
        } else if (newUrl.includes('/issues/') && number) {
          this.type = 'issue'
          this.loadingContribution = true
          this.issueDepositsAmount = 0
          this.issueReleasedTo = ''
          this.loadIssue(owner, repo, number)
            .then(repo => {
              this.contribution = repo
              this.$octoBay.methods.getIssueDepositIdsForIssueId(this.contribution.id).call().then(depositIds => {
                depositIds.forEach(depositId => {
                  this.$octoBay.methods._issueDeposits(depositId).call().then(deposit => {
                    this.issueDepositsAmount += Number(this.$web3.utils.fromWei(deposit.amount, 'ether'))
                  })
                })
              })
              this.$octoBay.methods._releasedIssues(this.contribution.id).call().then(releasedTo => {
                this.issueReleasedTo = releasedTo
              })
            })
            .finally(() => this.loadingContribution = false)
        }
      }
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'registeredAccount']),
    ...mapGetters("github", { githubUser: 'user', githubAccessToken: 'accessToken' })
  },
  mounted() {
    this.updateUserDeposits()
  },
  methods: {
    register() {
      this.loadingRegistration = true
      // start listening for request event
      const requestListener = this.$octoBay.events.RegistrationRequestEvent().on('data', event => {
        if (event.returnValues.account === this.account && event.returnValues.githubUser === this.githubUser.login) {
          // stop listening for request event and start listening for confirm event
          requestListener.unsubscribe()
          const confirmListener = this.$octoBay.events.RegistrationConfirmedEvent().on('data', event => {
            if (event.returnValues.account === this.account && event.returnValues.githubUser === this.githubUser.login) {
              // stop listening and finish process
              confirmListener.unsubscribe()
              this.$store.commit("setRegisteredAccount", this.account)
              this.showRegistrationSuccess = true
              this.loadingRegistration = false
            }
          })

          // trigger oracle confirmation
          this.$axios.$get(`${process.env.API_URL}/oracle/register/${this.githubUser.login}/${this.account}`).then(response => {
            if (response.error) {
              this.loadingRegistration = false
              this.showRegistrationError = response.error
            }
          }).catch(() => {
            this.loadingRegistration = false
            this.showRegistrationError = 0
          })
        }
      })

      // get gas price, trigger registration
      web3.eth.getGasPrice((error, gasPrice) => {
        this.$octoBay.methods.register(this.githubUser.login).send({
          from: this.account,
          value: process.env.ORACLE_GAS_REGISTRATION * Number(gasPrice) * 1.2
        }).catch(() => this.loadingRegistration = false)
      })
    },
    registerRetry() {
      this.showRegistrationError = 0
      this.loadingRegistration = true
      // trigger oracle confirmation
      this.$axios.$get(`${process.env.API_URL}/oracle/register/${this.githubUser.login}/${this.account}`).then(response => {
        if (response.error) {
          this.loadingRegistration = false
          this.showRegistrationError = response.error
        }
      }).catch(() => {
        this.loadingRegistration = false
        this.showRegistrationError = 0
      })
    },
    getAge(createdAt) {
      return (new Date().getTime() - new Date(createdAt).getTime()) / (60 * 60 * 24 * 1000);
    },
    calculatePRScore(repo) {
      const userAge = this.getAge(repo.pullRequest.author.createdAt);
      const userFollowers = repo.pullRequest.author.followers.totalCount;
      const repoAge = this.getAge(repo.createdAt);
      const repoStars = repo.stargazers.totalCount;
      const repoForks = repo.forkCount;

      let score = 0

      if (userAge > 365) score += 1;
      if (userAge > 365 * 5) score += 2;
      if (userAge > 365 * 10) score += 4;

      if (userFollowers > 50) score += 1;
      if (userFollowers > 250) score += 2;
      if (userFollowers > 1000) score += 4;

      if (repoAge > 90) score += 1;
      if (repoAge > 365) score += 2;
      if (repoAge > 365 * 5) score += 4;

      if (repoStars > 50) score += 1;
      if (repoStars > 250) score += 2;
      if (repoStars > 1000) score += 4;

      if (repoForks > 10) score += 1;
      if (repoForks > 50) score += 2;
      if (repoForks > 250) score += 4;

      return Math.min(Math.round(Math.round((score / 35) * 100)), 100)
    },
    claimPullRequest() {
      this.claimingPullRequest = true
      // start listening for request event
      const requestListener = this.$octoBay.events.ClaimPrRequestEvent().on('data', event => {
        if (event.returnValues.prId === this.contribution.pullRequest.id && event.returnValues.githubUser === this.githubUser.login) {
          // stop listening for request event and start listening for confirm event
          requestListener.unsubscribe()
          const confirmListener = this.$octoBay.events.ClaimPrConfirmEvent().on('data', event => {
            if (event.returnValues.prId === this.contribution.pullRequest.id && event.returnValues.githubUser === this.githubUser.login) {
              // stop listening and finish process
              confirmListener.unsubscribe()
              this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
              this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
              this.showClaimSuccess = true
              this.claimingPullRequest = false
              this.url = ''
              this.contribution = null
            }
          })

          // trigger oracle confirmation
          this.$axios.$get(`${process.env.API_URL}/oracle/claim/${this.githubUser.login}/${this.contribution.pullRequest.id}`).then(response => {
            if (response.error) {
              this.claimingPullRequest = false
              this.showClaimError = true
            }
          }).catch(() => {
            this.claimingPullRequest = false
            this.showClaimError = true
          })
        }
      })

      // trigger claim (get gas price first)
      web3.eth.getGasPrice((error, gasPrice) => {
        this.$octoBay.methods.claimPullRequest(this.contribution.pullRequest.id, this.githubUser.login).send({
          from: this.account,
          value: process.env.ORACLE_GAS_CLAIMPR * Number(gasPrice) * 1.2
        }).catch(() => this.claimingPullRequest = false)
      })
    },
    withdrawFromIssue() {
      this.withdrawingFromIssue = true
      this.$octoBay.methods.claimReleasedIssueDeposits(this.contribution.id).send({
        from: this.account
      }).then(() => {
        this.$store.commit('removeIssue', this.contribution.id)
        this.withdrawingFromIssue = false
        this.showWithdrawalSuccess = true
        this.contribution = null
        this.url = ''
        this.issueDepositsAmount = 0
        this.issueReleasedTo = ''
      }).catch(e => console.log(e))
    },
    withdrawUserDeposit(id) {
      this.withdrawingUserDeposit = id
      this.$octoBay.methods.withdrawUserDeposit(id).send({ from: this.account })
        .then(() => this.updateUserDeposits())
        .catch(e => console.log(e))
        .finally(() => this.withdrawingUserDeposit = 0)
    },
    updateUserDeposits() {
      let deposits = []
      if (this.githubUser) {
        this.$octoBay.methods.getUserDepositIdsForGithubUser(this.githubUser.login).call().then(ids => {
          ids.forEach(id => {
            this.$octoBay.methods._userDeposits(id).call().then(deposit => {
              if (Number(deposit.amount)) {
                deposit.id = id
                deposits.push(deposit)
              }
            })
          })
        })
      }
      this.userDeposits = deposits
    },
    formatAmount(amount) {
      return Number(this.$web3.utils.fromWei(amount.toString(), "ether")).toFixed(2)
    },
    copiedAddress() {
      this.copyAddressSuccess = true
      setTimeout(() => {
        this.copyAddressSuccess = false
      }, 1000)
    }
  }
}
</script>
