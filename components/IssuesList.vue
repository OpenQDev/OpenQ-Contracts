<template>
  <div class="card-body">
    <DepositForm class="pb-3 border-bottom" />
    <div class="issue-list">
      <Issue v-for="issue in issuesLazy" :issue="issue" :key="issue.id" />
    </div>
    <div class="card-body pt-0" v-if="issues.length > showIssuesNum">
      <button class="btn btn-primary text-center btn-block" @click="showIssuesNum += 10">
        load more
      </button>
    </div>
  </div>
</template>

<style lang="sass" scoped>
.issue-list
  > a
    border: solid 1px #eee
    color: #333
    &:hover
      border-color: transparent
      background: #0366d6
      color: white
      .text-muted,
      .text-danger
        color: white !important
      .badge-pill
        background: white
        color: #0366d6
</style>

<script>
import Vue from "vue"

export default {
  data() {
    return {
      issues: [],
      showIssuesNum: 10
    }
  },
  computed: {
    issuesSorted() {
      return this.issues.sort((a, b) => {
        if (a.boostAmount === b.boostAmount) {
          return a.depositAmount < b.depositAmount
        } else {
          return a.boostAmount < b.boostAmount
        }
      })
    },
    issuesLazy() {
      return this.issuesSorted.slice(0, this.showIssuesNum)
    }
  },
  mounted() {
    if (this.$mergePay) {
      this.$mergePay.methods._nextIssueDepositId().call().then(async maxId => {
        if (maxId) {
          let id = maxId
          while (id) {
            const deposit = await this.$mergePay.methods._issueDeposits(id).call()
            const depositAmount = Number(this.$web3.utils.fromWei(deposit.amount, 'ether'))
            if (depositAmount > 0) {
              let existingIssue = this.issues.find(issue => issue.id == deposit.issueId)
              if (existingIssue) {
                existingIssue.depositAmount += depositAmount
                existingIssue.deposits.push(deposit)
              } else {
                const newIssue = {
                  id: deposit.issueId,
                  deposits: [deposit],
                  depositAmount,
                  boostAmount: 0
                }
                const boostAmount = await this.$mergePay.methods._issueBoosts(newIssue.id).call()
                newIssue.boostAmount = Number(this.$web3.utils.fromWei(boostAmount, 'ether'))
                this.issues.push(newIssue)
              }
            }
            id--
          }
        }
      })
    }
  }
}
</script>
