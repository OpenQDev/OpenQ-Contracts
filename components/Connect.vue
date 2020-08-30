<template>
  <div class="mt-2 d-flex justify-content-center">
    <transition name="fade" mode="out-in">
      <span v-if="!connected" key="disconnected">
        <a href="#" class="mx-auto btn btn-sm btn-primary shadow-sm" @click="connect()" v-if="$web3">
          Connect
        </a>
        <a href="https://metamask.io" target="_blank" class="mx-auto btn btn-sm btn-primary shadow-sm" v-else>
          Install MetaMask
        </a>
      </span>
      <span v-else key="connected">
        <a href="#" class="mx-auto btn btn-sm btn-light position-relative wallet disabled">
          {{ formattedBalance }} ETH
          <span class="btn btn-sm btn-primary position-absolute address">
            <AddressShort :address="account" />
          </span>
        </a>
        <a href="#" class="mx-auto btn btn-sm btn-dark shadow-sm" @click="connectedGithub = true">
          <font-awesome-icon :icon="['fab', 'github']" />
          {{ connectedGithub ? 'mktcode' : 'Connect' }}
        </a>
      </span>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  data() {
    return {
      connectedGithub: false,
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'balance']),
    formattedBalance() {
      return Number(this.$web3.utils.fromWei(this.balance.toString(), "ether")).toFixed(2)
    }
  },
  methods: {
    connect() {
      this.$web3.eth.requestAccounts().then(accounts => {
        this.$store.commit('setAccounts', accounts)
        this.$web3.eth.getBalance(accounts[0]).then(balance => this.$store.commit('setBalance', balance))
      }).catch(err => {
        console.log(err.message)
      })
    },
  },
}
</script>

<style lang="sass">
  .wallet
    opacity: 1 !important
    font-weight: bold
    padding-right: 100px
    .address
      top: 0
      right: 0
</style>
