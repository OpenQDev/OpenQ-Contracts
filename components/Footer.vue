<template>
  <footer class="pt-5 pb-5 text-center">
    <div class="mb-5">
      <a href="https://twitter.com/thecodelander" target="_blank" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a href="https://github.com/mktcode" target="_blank" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
      <a href="#" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'ethereum']" />
      </a>
    </div>
    <a href="#" class="donate-btn text-dark" @click="showDonate = !showDonate">
      <small>{{ showDonate ? 'close' : 'donate' }}</small>
    </a>
    <div :class="['rounded-xl px-3 pt-5 pb-4 mb-5 shadow bg-white text-left overflow-hidden donate', { show: showDonate }]">
      <small>
        I can't guarantee anything because I need to find a normal job now. If you want to safe me from this destiny, so that I can continue to work on stuff like this, feel free to send some ETH or Tokens.
      </small>
      <div class="text-center my-2">
        <img src="/donate-address-qr.png" />
      </div>
      <div class="text-center">
        <small>0x27711f9c07230632F2EE1A21a967a9AC4729E520</small>
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
    margin-top: -40px
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
