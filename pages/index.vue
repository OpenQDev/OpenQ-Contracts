<template>
  <div class="card border-0 rounded-xl shadow">
    <div class="d-flex justify-content-around mt-3" v-if="view == 'deposit'">
      <span class="text-primary">Deposit</span>
      <a href="#" class="text-muted" @click="view = 'withdraw'">Withdraw</a>
    </div>
    <div class="d-flex justify-content-around mt-3" v-else>
      <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
      <span class="text-primary">Withdraw</span>
    </div>
    <transition name="fade" mode="out-in">
      <keep-alive>
        <DepositForm v-if="view == 'deposit'" />
        <WithdrawalForm v-else />
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
    ...mapGetters(['accounts']),
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
