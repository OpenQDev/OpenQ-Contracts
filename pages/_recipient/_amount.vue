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
        this.$octoBay.methods.userIDsByGithubUser(this.githubUser.login).call().then(userId => {
          if (userId) {
            this.$octoBay.methods.users(userId).call().then(result => {
              if (result.ethAddress !== "0x0000000000000000000000000000000000000000" && result.status === '2') {
                this.$store.commit('setRegisteredAccount', result.ethAddress)
              } else {
                this.$store.commit('setRegisteredAccount', null)
              }
            }).catch(() => {
              this.$store.commit('setRegisteredAccount', null)
            })
          } else {
            this.$store.commit('setRegisteredAccount', null)
          }
        }).catch(() => {
          this.$store.commit('setRegisteredAccount', null)
        })
      } else {
        this.$store.commit('setRegisteredAccount', null)
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
