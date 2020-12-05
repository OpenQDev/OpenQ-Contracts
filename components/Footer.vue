<template>
  <footer class="pt-5 pb-5 text-center">
    <div class="mb-3">
      <a href="https://twitter.com/OctoBayApp" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a href="https://github.com/mktcode" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
      <a href="https://kovan.etherscan.io/address/0x71b6f59B73ACD8C436dAb4EA3003a7E1e05a017e" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'ethereum']" />
      </a>
    </div>
    <div>
      <nuxt-link to="/about" class="text-white px-1" v-if="$route.path != '/about'">about</nuxt-link>
      <nuxt-link to="/" class="text-white px-1" v-if="$route.path != '/'">go to app</nuxt-link>
    </div>
  </footer>
</template>

<style lang="sass" scoped>
footer
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
export default {
  data() {
    return {
      showDonate: false
    }
  }
}
</script>
