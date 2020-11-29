<template>
  <div class="card-body">
    <DepositForm />
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
import { mapGetters } from "vuex"

export default {
  data() {
    return {
      showIssuesNum: 10
    }
  },
  computed: {
    ...mapGetters(['issues']),
    issuesSorted() {
      return this.issues.filter(() => true).sort((a, b) => {
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
    this.$store.dispatch('updateIssues')
  }
}
</script>
