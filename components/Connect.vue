<template>
  <div class="d-flex justify-content-center">
    <transition name="fade" mode="out-in">
      <span v-if="!connected" key="disconnected">
        <a href="#" class="mx-auto btn btn-sm btn-primary shadow-sm" @click="connect()" v-if="$web3">
          Connect
        </a>
        <a href="https://metamask.io" target="_blank" class="mx-auto btn btn-sm btn-primary shadow-sm" v-else>
          Install MetaMask
        </a>
      </span>
      <span v-else key="connected" class="d-flex flex-column align-items-center">
        <span v-if="githubUser">
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
        <div class="d-flex flex-column text-center mt-1">
          <div>
            <b>{{ formattedBalance }} ETH</b>
            <AddressShort :address="account" class="ml-2" />
          </div>
          <small v-if="networkId != 1" class="text-muted">
            <small><font-awesome-icon :icon="['fas', 'circle']" class="text-warning" /></small>
            {{ networkId === 3 ? 'Ropsten' : (networkId === 4 ? 'Rinkeby' : (networkId === 42 ? 'Kovan' : 'Unknown Testnet')) }}
          </small>
          <small v-else class="text-muted">
            <small><font-awesome-icon :icon="['fas', 'circle']" class="text-success" /></small>
            Mainnet
          </small>
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
    ...mapGetters(['connected', 'account', 'balance', 'registeredAccount', 'networkId']),
    ...mapGetters("github", { githubUser: 'user' }),
    formattedBalance() {
      return Number(this.$web3.utils.fromWei(this.balance.toString(), "ether")).toFixed(2)
    },
  }
}
</script>
