<template>
  <div>
    <div class="issue-list mt-3">
      <Issue v-for="issue in issues" :issueId="issue.id" :depositAmount="issue.depositAmount" :boostAmount="issue.boostAmount" :key="issue.id" />
    </div>
    <div class="card-body">
      <button class="btn btn-primary text-center btn-block" disabled>
        Comming soon!
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
export default {
  data() {
    return {
      issueDeposits: []
    }
  },
  computed: {
    issues() {
      let issues = []
      this.issueDeposits.forEach(deposit => {
        let depositAmount = Number(this.$web3.utils.fromWei(deposit.amount, 'ether'))
        let boostAmount = Number(this.$web3.utils.fromWei(deposit.amount, 'ether')) * Math.floor(Math.random() * 10)

        let existingIssue = issues.find(issue => issue.id == deposit.issueId)
        if (existingIssue) {
          existingIssue.depositAmount += depositAmount
          existingIssue.boostAmount += boostAmount
        } else {
          issues.push({
            id: deposit.issueId,
            boostAmount,
            depositAmount
          })
        }
      })

      return issues.sort((a, b) => {
        if (a.boostAmount === b.boostAmount) {
          return a.depositAmount < b.depositAmount
        } else {
          return a.boostAmount < b.boostAmount
        }
      })
    }
  },
  mounted() {
    if (this.$mergePay) {
      this.$mergePay.methods._nextIssueDepositId().call().then(maxId => {
        if (maxId) {
          let id = 1
          while (id <= maxId) {
            this.$mergePay.methods._issueDeposits(id).call().then(deposit => {
              if (Number(this.$web3.utils.fromWei(deposit.amount, 'ether')) > 0) {
                this.issueDeposits.push(deposit)
              }
            })
            id++
          }
        }
      })
    }
  }
}
</script>
