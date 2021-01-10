<template>
  <footer class="pt-3 pb-5 text-center">
    <button class="d-flex mx-auto align-items-center btn btn-link text-white btn-sm rounded-xl mb-4 oracle-button" @click="$store.commit('setShowOracleList', true)">
      <img src="/chainlink-icon.png" width="24px" class="rounded-xl p-1" />
      {{ activeOracle ? activeOracle.name : 'Random' }}
      <small class="ml-1"><font-awesome-icon :icon="['fas', 'chevron-down']" style="opacity: 0.5" /></small>
    </button>
    <div class="mb-3">
      <a href="https://twitter.com/OctoBayApp" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a href="https://discord.gg/DhKgHrFeCD" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'discord']" />
      </a>
      <a href="https://github.com/mktcode/octobay" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
      <a href="https://kovan.etherscan.io/address/0xDB065c6421ba13C8d4Fb66dAca7dE25E22E72dBe" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'ethereum']" />
      </a>
    </div>
    <div>
      <nuxt-link to="/about" class="text-white px-1" v-if="$route.path != '/about'">about</nuxt-link>
      <nuxt-link to="/" class="text-white px-1" v-if="$route.path == '/about'">go to app</nuxt-link>
    </div>
  </footer>
</template>

<style lang="sass" scoped>
footer
  .oracle-button
    opacity: 0.5
    transition: opacity .2s ease
    &:hover,
    &:active,
    &:focus
      text-decoration: none
      opacity: 1
  a
    opacity: 0.5
    &:hover
      opacity: 1
  .donate-btn
    position: relative
    z-index: 1
  .donate
    max-width: 330px
    position: relative
    z-index: 0
    opacity: 0
    max-height: 0
    transition: opacity .3s ease, max-height .3s ease
    &.show
      opacity: 1
      max-height: 500px
</style>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      showDonate: false
    }
  },
  computed: {
    ...mapGetters(['activeOracle'])
  }
}
</script>
