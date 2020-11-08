<template>
  <div class="d-flex justify-content-center text-white-50">
    <transition name="fade" mode="out-in">
      <span v-if="!connected" key="disconnected">
        <a href="#" class="mx-auto btn btn-sm btn-light shadow-sm" @click="connect()" v-if="$web3">
          Connect
        </a>
        <a href="https://metamask.io" target="_blank" class="mx-auto btn btn-sm btn-light shadow-sm" v-else>
          Install MetaMask
        </a>
      </span>
      <span v-else key="connected" class="d-flex align-items-start">
        <span v-if="githubUser" class="text-nowrap">
          <font-awesome-icon :icon="['fab', 'github']" />
          {{ githubUser.login }}
          <a
            v-if="registeredAccount && registeredAccount != account"
            class="btn btn-sm px-1 py-0 text-danger"
            v-tooltip="'You are not connected to the Ethereum account registered with this GitHub account. Switch accounts or register again.'"
          >
            <small><font-awesome-icon :icon="['fas', 'exclamation-triangle']" /></small>
          </a>
        </span>
        <a
          v-if="!githubUser"
          :href="
            'https://github.com/login/oauth/authorize?scope=user:email&client_id=' +
              githubClientId
          "
          class="mx-auto btn btn-sm btn-dark shadow-sm"
        >
          <font-awesome-icon :icon="['fab', 'github']" />
          Connect
        </a>
        <div class="d-flex text-right ml-5">
          <div class="d-flex flex-column">
            <AddressShort :address="account" />
            <small>
              <sup class="text-nowrap">
                {{ networkId === 1 ? 'Mainnet' : networkId === 3 ? 'Ropsten' : (networkId === 4 ? 'Rinkeby' : (networkId === 42 ? 'Kovan' : 'Unknown Testnet')) }}
              </sup>
            </small>
          </div>
          <div class="d-flex flex-column ml-2">
            <b class="text-nowrap">{{ formattedBalance }} ETH</b>
            <small class="text-nowrap">{{ formattedOctoBalance }} PIN</small>
          </div>
        </div>
      </span>
    </transition>
  </div>
</template>

<style lang="sass">
.disabled
  opacity: 1 !important
  z-index: 1 !important
</style>

<script>
import { mapGetters } from "vuex"
import connect from "@/mixins/connect"

export default {
  mixins: [connect],
  data() {
    return {
      githubClientId: process.env.GITHUB_CLIENT_ID,
      connectedGithub: false,
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'balance', 'octoBalance', 'registeredAccount', 'networkId']),
    ...mapGetters("github", { githubUser: 'user' }),
    formattedBalance() {
      return Number(this.$web3.utils.fromWei(this.balance.toString(), "ether")).toFixed(2)
    },
    formattedOctoBalance() {
      return Number(this.$web3.utils.fromWei(this.octoBalance.toString(), "ether")).toFixed(2)
    },
  }
}
</script>
