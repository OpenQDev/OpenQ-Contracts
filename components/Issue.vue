<template>
  <div>
    <div v-if="issueNode" :class="['issue d-flex flex-column px-3 py-2', { 'pinned': issue.boostAmount > 0, showDetails }]" @click="showDetails = !showDetails">
      <div class="d-flex align-items-top">
        <div class="text-truncate">
          <div class="text-truncate">
            <svg v-if="issueNode.closed" height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#c00" d="M1.5 8a6.5 6.5 0 0110.65-5.003.75.75 0 00.959-1.153 8 8 0 102.592 8.33.75.75 0 10-1.444-.407A6.5 6.5 0 011.5 8zM8 12a1 1 0 100-2 1 1 0 000 2zm0-8a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 018 4zm4.78 4.28l3-3a.75.75 0 00-1.06-1.06l-2.47 2.47-.97-.97a.749.749 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0z"></path>
            </svg>
            <svg v-else height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#0a0" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path>
            </svg>
            {{ issueNode.title }}
          </div>
          <small class="text-muted text-truncate">
            {{ issueNode.owner }}/{{ issueNode.repository }}/issues/{{ issueNode.number }}
          </small>
        </div>
        <div class="text-nowrap text-right ml-auto pl-2">
          <h5 class="mb-0">{{ issue.depositAmount }} <small>ETH</small></h5>
          <small class="d-block text-muted mt-1" v-if="issue.boostAmount">
            <svg style="width:14px;height:14px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
            </svg>
            {{ issue.boostAmount }}
          </small>
        </div>
      </div>
      <div>
        <span :class="'mr-1 badge badge-pill' + (brightnessByColor(issueNode.primaryLanguage.color) < 180 ? ' text-white' : '')" :style="'background-color: ' + issueNode.primaryLanguage.color">
          {{ issueNode.primaryLanguage.name }}
        </span><span :class="'mr-1 badge badge-pill' + (brightnessByColor('#' + label.color) < 180 ? ' text-white' : '')" v-for="label in issueNode.labels" :style="'background-color: #' + label.color">
          {{ label.name }}
        </span>
      </div>
      <transition name="fade">
        <div :class="['d-flex flex-column mt-2 justify-content-start align-items-center', { action: !!action, deposits: action == 'deposits' }]" @click.stop v-if="showDetails" style="cursor: default">
          <div class="border-top w-100 pt-2 text-nowrap d-flex align-items-center">
            <button :class="['btn btn-sm btn-light mr-auto', { active: action === 'deposits' }]" @click="changeAction('deposits')">
              <font-awesome-icon :icon="['fas', 'coins']" class="mr-1" />
              <span class="text-muted">Deposits</span>
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
              <div v-if="action === 'deposits'" key="deposits" class="pt-3">
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
                <div v-if="issueNode.repositoryOwner === githubUser.login && account === registeredAccount" class="mb-2 d-flex">
                  <input type="text" class="form-control" placeholder="GitHub user" v-model="releaseTo" />
                  <button class="btn btn-success ml-1 shadow-sm" @click="release()" :disabled="releasing">
                    <font-awesome-icon :icon="['fas', 'circle-notch']" spin v-if="releasing" />
                    <span v-else>release</span>
                  </button>
                </div>
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
              <div v-if="action === 'pin'" key="pin" class="pt-3">
                <div class="d-flex align-items-center">
                  <form class="amount-input amount-input-sm flex-fill mr-2" novalidate>
                    <input type="number" min="0" step="0.01" novalidate class="form-control" placeholder="0.00" v-model="pinAmount" />
                    <span>OPIN</span>
                  </form>
                  <button class="btn btn-primary shadow-sm text-nowrap" @click="pin()" :disabled="pinningIssue">
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

<style lang="sass">
.issue
  border-top: solid 1px #fff
  cursor: pointer
  position: relative
  &:last-child
    padding-bottom: 1rem !important
  &.pinned
    border-color: #fb0 !important

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
</style>

<script>
import { mapGetters } from 'vuex'
import loadFromGithub from '@/mixins/loadFromGithub'

export default {
  props: ['issue'],
  mixins: [loadFromGithub],
  data() {
    return {
      issueNode: null,
      showDetails: false,
      action: null,
      pinAmount: 0,
      releaseTo: '',
      releasing: false,
      showReleaseSuccess: false,
      showReleaseError: false,
      pinningIssue: false,
      refundingDeposit: false
    }
  },
  computed: {
    ...mapGetters(['account', 'registeredAccount']),
    ...mapGetters('github', { githubUser: 'user' })
  },
  methods: {
    brightnessByColor(color) {
      var color = "" + color, isHEX = color.indexOf("#") == 0, isRGB = color.indexOf("rgb") == 0;
      if (isHEX) {
        const hasFullSpec = color.length == 7;
        var m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
        if (m) var r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16), g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16), b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
      }
      if (isRGB) {
        var m = color.match(/(\d+){3}/g);
        if (m) var r = m[0], g = m[1], b = m[2];
      }
      if (typeof r != "undefined") return ((r*299)+(g*587)+(b*114))/1000;
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
          from: this.account
        }).then(result => {
          this.$store.dispatch('updatePins', this.issue.id)
          this.$octoBay.methods.balanceOf(this.account).call().then(balance => this.$store.commit('setOctoBalance', balance))
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
        from: this.account
      }).then(() => {
        this.$store.commit('removeDeposit', { issueId: this.issue.id, depositId: id })
      }).catch(e => console.log(e)).finally(() => this.refundingDeposit = false)
    },
    release() {
      if (this.releaseTo) {
        this.releasing = true
        // start listening for request event
        const requestListener = this.$octoBay.events.ReleaseIssueDepositsRequestEvent().on('data', event => {
          if (event.returnValues.githubUser === this.releaseTo && event.returnValues.owner === this.githubUser.login && event.returnValues.issueId === this.issue.id) {
            // stop listening for request event and start listening for confirm event
            requestListener.unsubscribe()
            const confirmListener = this.$octoBay.events.ReleaseIssueDepositsConfirmEvent().on('data', event => {
              if (event.returnValues.githubUser === this.releaseTo && event.returnValues.owner === this.githubUser.login && event.returnValues.issueId === this.issue.id) {
                // stop listening and finish process
                confirmListener.unsubscribe()
                this.showReleaseSuccess = true
                this.releasing = false
              }
            })

            // trigger oracle confirmation
            this.$axios.$get(`${process.env.API_URL}/oracle/release/${this.releaseTo}/${this.issue.id}`).then(response => {
              if (response.error) {
                this.releasing = false
                this.showReleaseError = true
              }
            }).catch(() => {
              this.releasing = false
              this.showReleaseError = true
            })
          }
        })

        // trigger release (get gas price first)
        web3.eth.getGasPrice((error, gasPrice) => {
          this.$octoBay.methods.releaseIssueDeposits(this.issue.id, this.releaseTo).send({
            from: this.account,
            value: process.env.ORACLE_GAS_RELEASEISSUE * Number(gasPrice) * 1.2
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
