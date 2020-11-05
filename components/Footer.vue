<template>
  <footer class="pt-5 pb-5 text-center">
    <div class="mb-3">
      <a href="https://twitter.com/thecodelander" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a href="https://github.com/mktcode" target="_blank" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
      <a href="https://etherscan.io" class="text-white px-2">
        <font-awesome-icon :icon="['fab', 'ethereum']" />
      </a>
    </div>
    <a href="#" class="donate-btn text-white" @click="showDonate = !showDonate">
      <svg style="width:24px;height:24px" viewBox="0 0 24 24" v-if="showDonate">
        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
      <small v-else>donate</small>
    </a>
    <div :class="['donate overflow-hidden text-left text-white mt-2', { show: showDonate }]">
      <small>
        Help me to grow and evolve this project and fund more professional development and code audits by sending ETH to the following address:
      </small>
      <div class="text-center my-3">
        <small>0x27711f9c07230632F2EE1A21a967a9AC4729E520</small>
      </div>
      <div class="text-center my-4">
        <img src="/donate-address-qr.png" class="rounded-xl p-2 bg-white" />
      </div>
    </div>
  </footer>
</template>

<style lang="sass" scoped>
footer
  a
    font-size: 1.2rem
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
