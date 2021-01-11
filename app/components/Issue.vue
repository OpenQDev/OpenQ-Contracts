<template>
  <div>
    <div v-if="issueNode" :class="['issue d-flex flex-column', { 'pinned': issue.boostAmount > 0, showDetails }]" @click="showDetails = !showDetails">
      <div>
        <div class="bg-success" :style="`height: 5px; width: ${(issue.depositAmount / 5 * 100).toFixed(2)}%`"></div>
      </div>
      <div class="d-flex align-items-top px-3 py-2">
        <div :class="{ 'text-truncate': !showDetails }">
          <small class="text-muted text-truncate">
            <small>
              <span v-if="issue.boostAmount || true">
                <svg style="width:14px;height:14px" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
                </svg>
              </span>
              {{ issueNode.owner }}/{{ issueNode.repository }}/issues/{{ issueNode.number }}
            </small>
          </small>
          <div :class="{ 'text-truncate': !showDetails }">
            <svg v-if="issueNode.closed" height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#c00" d="M1.5 8a6.5 6.5 0 0110.65-5.003.75.75 0 00.959-1.153 8 8 0 102.592 8.33.75.75 0 10-1.444-.407A6.5 6.5 0 011.5 8zM8 12a1 1 0 100-2 1 1 0 000 2zm0-8a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 018 4zm4.78 4.28l3-3a.75.75 0 00-1.06-1.06l-2.47 2.47-.97-.97a.749.749 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0z"></path>
            </svg>
            <svg v-else height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#0a0" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path>
            </svg>
            {{ issueNode.title }}
          </div>
        </div>
        <div class="text-nowrap text-right ml-auto pl-3">
          <div class="mb-0 d-flex align-items-center" @click.stop>
            <div class="text-center d-flex flex-column">
              <small class="text-muted">
                <small>5 ETH Goal</small>
              </small>
              <div>
                {{ issue.depositAmount }} ETH
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="issueNode.primaryLanguage" :class="['px-3 pb-2', { 'text-truncate': !showDetails }]" style="text-overflow: ' ...'">
        <span :class="'mr-1 badge badge-pill' + (brightnessByColor(issueNode.primaryLanguage.color) < 180 ? ' text-white' : '')" :style="'background-color: ' + issueNode.primaryLanguage.color">
          {{ issueNode.primaryLanguage.name }}
        </span><span :class="'mr-1 badge badge-pill' + (brightnessByColor('#' + label.color) < 180 ? ' text-white' : '')" v-for="label in issueNode.labels" :style="'background-color: #' + label.color">
          {{ label.name }}
        </span>
      </div>
      <transition name="fade">
        <div :class="['d-flex flex-column justify-content-start align-items-center px-3', { action: !!action, deposits: action == 'deposits' }]" @click.stop v-if="showDetails" style="cursor: default">
          <div class="border-top w-100 py-2 text-nowrap d-flex align-items-center">
            <button class="btn btn-sm btn-outline-success" @click="fundIssue(issueNode.owner, issueNode.repository, issueNode.number)">
              <font-awesome-icon :icon="['fas', 'plus']" />
            </button>
            <button :class="['btn btn-sm btn-light ml-2', { active: action === 'release' }]" @click="changeAction('release')" v-if="githubUser && issueNode.repositoryOwner === githubUser.login">
              <font-awesome-icon :icon="['fas', 'gavel']" />
            </button>
            <span class="mr-auto"></span>
            <button :class="['btn btn-sm btn-light ml-1', { active: action === 'deposits' }]" @click="changeAction('deposits')">
              <font-awesome-icon :icon="['fas', 'coins']" />
            </button>
            <button :class="['btn btn-sm btn-light ml-1', { active: action === 'pin' }]" @click="changeAction('pin')">
              <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
              </svg>
            </button>
            <a class="btn btn-sm btn-light ml-1" @click :href="'https://github.com/' + issueNode.owner + '/' + issueNode.repository + '/issues/' + issueNode.number" target="_blank">
              <font-awesome-icon :icon="['fab', 'github']" />
              <font-awesome-icon :icon="['fas', 'external-link-alt']" class="text-muted-light ml-1" />
            </a>
          </div>
          <div class="w-100">
            <transition name="fade" mode="out-in">
              <div v-if="action === 'release'" key="release" class="py-2">
                <div class="alert alert-success border-0" v-if="showReleaseSuccess">
                  <button type="button" class="close text-success" @click="showReleaseSuccess = false">
                    <span>&times;</span>
                  </button>
                  <CheckIcon width="24px" height="24px" />
                  <small>Release successful! The GitHub user can now claim the deposits.</small>
                </div>
                <div class="alert alert-danger border-0" v-if="showReleaseError">
                  <button type="button" class="close text-danger" @click="showReleaseError = false">
                    <span>&times;</span>
                  </button>
                  <small>
                    Release failed! You need to be the owner of the repository. If you are, the problem might be on our side.
                    Please let us know on <a href="https://twitter.com/OctoBayApp" target="_blank">Twitter</a> or <a href="https://discord.gg/DhKgHrFeCD" target="_blank">Discord</a>.
                  </small>
                </div>
                <div class="d-flex">
                  <div class="d-flex flex-fill position-relative">
                    <input type="text" class="form-control" placeholder="GitHub user" v-model="releaseTo" />
                    <div v-if="loadingReleaseToUser || releaseToUser" class="position-absolute" style="right: 0; top: 0;">
                      <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="loadingReleaseToUser" class="text-muted-light m-2" />
                      <a :href="releaseToUser.url" target="_blank" class="avatar d-block m-1" :style="'background-image: url(' + releaseToUser.avatarUrl + ')'" v-if="releaseToUser"></a>
                    </div>
                  </div>
                  <button class="btn btn-success ml-1 shadow-sm" @click="release()" :disabled="releasing || !releaseToUser">
                    <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="releasing" />
                    <span v-else class="text-nowrap">
                      <font-awesome-icon :icon="['fas', 'gavel']" class="mr-1" />
                      release
                    </span>
                  </button>
                </div>
              </div>
              <div v-if="action === 'deposits'" key="deposits" class="py-2">
                <div v-for="(deposit, index) in issue.deposits" :key="index" class="d-flex justify-content-between align-items-center">
                  <div class="d-flex flex-column">
                    <h5 class="mb-0">{{ Number($web3.utils.fromWei(deposit.amount, 'ether')) }} <small>ETH</small></h5>
                    <small class="text-muted">
                      From: <AddressShort :address="deposit.from" />
                    </small>
                  </div>
                  <button class="btn btn-primary shadow-sm" v-if="deposit.from === account" @click="refundIssueDeposit(deposit.id)" :disabled="refundingDeposit">
                    <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="refundingDeposit === deposit.id" />
                    <span v-else>refund</span>
                  </button>
                </div>
              </div>
              <div v-if="action === 'pin'" key="pin" class="py-2">
                <div class="d-flex align-items-center">
                  <div class="select-input flex-fill mr-2">
                    <input type="number" min="0" step="0.01" novalidate class="form-control" placeholder="0.00" v-model="pinAmount" />
                    <span class="text-muted mr-2">OPIN</span>
                  </div>
                  <button class="btn btn-primary shadow-sm text-nowrap" @click="pin()" :disabled="pinningIssue || !Number(pinAmount)">
                    <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="pinningIssue" />
                    <span v-else>
                      <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
                      </svg>
                      Pin
                    </span>
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </transition>
    </div>
    <div v-else-if="!issueNode" class="d-flex justify-content-center p-4 m-3 rounded-lg">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" />
    </div>
  </div>
</template>

<style lang="sass" scoped>
.issue
  border-top: solid 1px #fff
  cursor: pointer
  position: relative
  &.pinned
    box-shadow: inset 0 0 30px rgba(255, 187, 0, 0.1) !important
    &.showDetails
      box-shadow: inset 0 0 30px rgba(255, 187, 0, 0.1), inset 0 0 7px rgba(0, 0, 0, 0.2) !important

  &:hover
    background: #f8f8f8
  &.showDetails
    background: #f8f8f8
    box-shadow: inset 0 0 7px rgba(0, 0, 0, 0.2)
    .details
      max-height: 40px
      cursor: default
      &.action
        max-height: 100px
      &.deposits
        max-height: 350px

.avatar
  border: solid 2px #ccc
  border-radius: 50%
  width: 32px
  height: 32px
  background-repeat: no-repeat
  background-position: center center
  background-size: 100%
</style>

<script>
import { mapGetters } from 'vuex'
import loadFromGithub from '@/mixins/loadFromGithub'
import helpers from '@/mixins/helpers'

export default {
  props: ['issue'],
  mixins: [loadFromGithub, helpers],
  data() {
    return {
      issueNode: null,
      showDetails: false,
      action: null,
      pinAmount: 10,
      releaseTo: '',
      releasing: false,
      showReleaseSuccess: false,
      showReleaseError: false,
      pinningIssue: false,
      refundingDeposit: false,
      loadReleaseToUserTimeout: null,
      loadingReleaseToUser: false,
      releaseToUser: null,
      releaseRequestID: null
    }
  },
  watch: {
    releaseTo(newUsername, oldUsername) {
      clearTimeout(this.loadReleaseToUserTimeout)
      this.loadReleaseToUserTimeout = setTimeout(() => {
        if (newUsername) {
          this.loadingReleaseToUser = true
          this.releaseToUser = null
          this.loadUser(newUsername)
            .then(user => {
              this.releaseToUser = user
            })
            .catch(() => {
              this.releaseToUser = null
            })
            .finally(() => this.loadingReleaseToUser = false)
        } else {
          this.releaseToUser = null
          this.loadingReleaseToUser = false
        }
      }, 500)
    },
  },
  computed: {
    ...mapGetters(['account', 'registeredAccount']),
    ...mapGetters('github', { githubUser: 'user' })
  },
  methods: {
    fundIssue(username, repository, number) {
      this.$store.commit('setRedirectPrefills', {
        type: 'send-issue',
        username,
        repository,
        issue: number,
        amount: '1.0'
      })
      this.$store.commit('setView', 'send')
    },
    changeAction(action) {
      if (this.action === action) {
        this.action = null
      } else {
        this.action = action
      }
    },
    pin() {
      if (this.$octoBay) {
        this.pinningIssue = true
        this.$octoBay.methods.pinIssue(this.issue.id, this.$web3.utils.toWei(this.pinAmount, 'ether')).send({
          // useGSN: false,
          from: this.account
        }).then(result => {
          this.$store.dispatch('updatePins', this.issue.id)
          this.$store.dispatch('updateOctoPinBalance')
          this.$web3.eth.getBalance(this.account).then(balance => this.$store.commit('setBalance', balance))
          this.pinAmount = 0
        }).catch(e => {
          console.log(e)
        }).finally(() => {
          this.pinningIssue = false
        })
      }
    },
    refundIssueDeposit(id) {
      this.refundingDeposit = id
      this.$octoBay.methods.refundIssueDeposit(id).send({
        // useGSN: false,
        from: this.account
      }).then(() => {
        this.$store.commit('removeDeposit', { issueId: this.issue.id, depositId: id })
      }).catch(e => console.log(e)).finally(() => this.refundingDeposit = false)
    },
    release() {
      if (this.releaseTo) {
        this.releasing = true
        // start listening for request event
        const confirmListener = this.$octoBay.events.ChainlinkFulfilled().on('data', event => {
          if (event.returnValues.id === this.releaseRequestID) {
            // stop listening and finish process
            confirmListener.unsubscribe()
            this.showReleaseSuccess = true
            this.releasing = false,
            this.releaseRequestID = null
          }
        })

        // trigger release (get gas price first)
        web3.eth.getGasPrice((error, gasPrice) => {
          this.$octoBay.methods.releaseIssueDeposits(
            process.env.ORACLES[0].address,
            this.$web3.utils.toHex(process.env.ORACLES[0].jobs.release),
            this.issue.id,
            this.releaseTo
          ).send({
            // useGSN: false,
            from: this.account,
          }).then(releaseRequest => {
            this.releaseRequestID = releaseRequest.events.ChainlinkRequested.returnValues.id
          }).catch(() => this.releasing = false)
        })
      }
    }
  },
  mounted() {
    this.loadIssueById(this.issue.id).then(issue => {
      this.issueNode = {
        number: issue.number,
        title: issue.title,
        owner: issue.repository.owner.login,
        repository: issue.repository.name,
        repositoryOwner: issue.repository.owner.login,
        primaryLanguage: issue.repository.primaryLanguage,
        labels: issue.labels.edges.map(label => label.node),
        closed: issue.closed
      }
    })
  }
}
</script>
