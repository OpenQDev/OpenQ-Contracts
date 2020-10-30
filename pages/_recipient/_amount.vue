<template>
  <div class="card border-0 rounded-xl shadow">
    <SendForm />
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  transition: 'fade',
  layout: 'reduced',
  computed: {
    ...mapGetters(['accounts', 'registered']),
    ...mapGetters('github', { githubUser: 'user' }),
  },
  watch: {
    githubUser() {
      if (this.githubUser) {
        this.$mergePay.methods._users(this.githubUser.login).call().then(result => {
          if (result.account !== "0x0000000000000000000000000000000000000000" && result.confirmations) {
            this.$store.commit('setRegistered', true)
          } else {
            this.$store.commit('setRegistered', false)
          }
        }).catch(() => {
          this.$store.commit('setRegistered', false)
        })
      } else {
        this.$store.commit('setRegistered', false)
      }
    }
  },
  mounted() {
    if (this.$web3) {
      this.$web3.eth.getAccounts().then(accounts => {
        if (accounts.length) {
          this.$store.commit('setAccounts', accounts)
          this.$web3.eth.getBalance(accounts[0]).then(balance => this.$store.commit('setBalance', balance))
        }
      })
    }
  }
}
</script>

<style lang="sass" scoped>
  .card
    width: 380px
</style>
