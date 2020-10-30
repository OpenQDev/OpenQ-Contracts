<template>
  <div class="card border-0 rounded-xl shadow">
    <div class="d-flex justify-content-around mt-3" v-if="view == 'deposit'">
      <a href="#" class="text-muted" @click="view = 'send'">Send</a>
      <span class="text-primary">Deposit</span>
      <a href="#" class="text-muted" @click="view = 'withdraw'">
        {{ registered ? 'Withdraw' : 'Register' }}
      </a>
    </div>
    <div class="d-flex justify-content-around mt-3" v-else-if="view == 'withdraw'">
      <a href="#" class="text-muted" @click="view = 'send'">Send</a>
      <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
      <span class="text-primary">
        {{ registered ? 'Withdraw' : 'Register' }}
      </span>
    </div>
    <div class="d-flex justify-content-around mt-3" v-else-if="view == 'send'">
      <span class="text-primary">Send</span>
      <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
      <a href="#" class="text-muted" @click="view = 'withdraw'">
        {{ registered ? 'Withdraw' : 'Register' }}
      </a>
    </div>
    <transition name="fade" mode="out-in">
      <keep-alive>
        <DepositForm v-if="view == 'deposit'" />
        <WithdrawalForm v-else-if="view == 'withdraw'" />
        <SendForm v-else-if="view == 'send'" />
      </keep-alive>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  transition: 'fade',
  data() {
    return {
      view: 'deposit',
    }
  },
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
