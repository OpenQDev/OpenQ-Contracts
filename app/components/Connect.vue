<template>
  <transition name="fade" mode="out-in">
    <div v-if="connected && githubUser" :class="cssClasses + ' pr-4'">
      <a :href="githubUser.html_url" target="_blank" class="rounded-circle shadow-sm avatar border" :style="'background-image: url(' + githubUser.avatar_url + ')'"></a>
      <a
        v-if="registeredAccount && registeredAccount != account"
        class="btn btn-sm btn-light rounded-circle mx-2 text-warning"
        v-tooltip="'You are not connected to the Ethereum account registered with this GitHub account. Switch accounts or register again.'"
      >
        <small><font-awesome-icon :icon="['fas', 'exclamation-triangle']" /></small>
      </a>
      <div class="d-flex flex-column text-center mx-auto px-3">
        <AddressShort :address="account" />
        <small>
          <sup class="text-nowrap">
            {{ networkId === 1 ? 'Mainnet' : networkId === 3 ? 'Ropsten' : (networkId === 4 ? 'Rinkeby' : (networkId === 42 ? 'Kovan' : 'Unknown Testnet')) }}
          </sup>
        </small>
      </div>
      <div class="d-flex flex-column text-right">
        <b class="text-nowrap">{{ formattedBalance }} ETH</b>
        <small class="text-nowrap" style="margin-top: -3px">{{ formattedOctoPinBalance }} OPIN</small>
      </div>
    </div>

    <div v-else-if="connected" :class="cssClasses">
      <Logo color="white" class="mr-2" size="md" style="background-color: #004A9D; border-radius: 50%;" />
      <a
        v-if="!githubUser"
        :href="
          'https://github.com/login/oauth/authorize?scope=user:email&client_id=' +
            githubClientId
        "
        class="ml-2 btn btn-lg btn-light shadow-sm"
      >
        Connect GitHub
      </a>
    </div>

    <div v-else :class="cssClasses">
      <Logo color="white" class="mr-2" size="md" style="background-color: #004A9D; border-radius: 50%;" />
      <span v-if="!connected" key="disconnected" class="d-flex align-items-center">
        <a href="#" class="ml-2 btn btn-lg btn-light shadow-sm" @click="connect()" v-if="$web3">
          Connect Wallet
        </a>
        <a href="https://metamask.io" target="_blank" class="ml-2 btn btn-lg btn-light shadow-sm" v-else>
          Install MetaMask
        </a>
      </span>
    </div>
  </transition>
</template>

<style lang="sass" scoped>
.avatar
  width: 46px
  height: 46px
  background-repeat: no-repeat
  background-position: center center
  background-size: 100%
  border-width: 2px !important

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
      cssClasses: 'd-flex justify-content-between align-items-center text-muted bg-white shadow-sm rounded-xl p-1 connect'
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'balance', 'octoPinBalance', 'registeredAccount', 'networkId']),
    ...mapGetters("github", { githubUser: 'user' }),
    formattedBalance() {
      return Number(this.$web3.utils.fromWei(this.balance.toString(), "ether")).toFixed(2)
    },
    formattedOctoPinBalance() {
      return Number(this.$web3.utils.fromWei(this.octoPinBalance.toString(), "ether")).toFixed(2)
    },
  }
}
</script>
