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
        <span href="#" class="mx-auto btn-group">
          <span class="btn btn-sm btn-light disabled">
            <b>{{ formattedBalance }} ETH</b>
          </span>
          <span class="btn btn-sm btn-primary disabled">
            <AddressShort :address="account" />
          </span>
          <span class="btn btn-sm btn-dark disabled" v-if="githubUser">
            <font-awesome-icon :icon="['fab', 'github']" />
            {{ githubUser.login }}
          </span>
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

export default {
  data() {
    return {
      githubClientId: process.env.GITHUB_CLIENT_ID,
      connectedGithub: false,
    }
  },
  computed: {
    ...mapGetters(['connected', 'account', 'balance']),
    ...mapGetters("github", { githubUser: 'user' }),
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
