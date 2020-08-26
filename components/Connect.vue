<template>
  <div class="mt-2 d-flex justify-content-center">
    <transition name="fade" mode="out-in">
      <a href="#" class="mx-auto btn btn-sm btn-primary shadow-sm" @click="connected = true" v-if="!connected" key="disconnected">
        Connect
      </a>
      <span v-else key="connected">
        <a href="#" class="mx-auto btn btn-sm btn-light shadow-sm position-relative wallet" @click="connected = false">
          1.49 ETH
          <span class="btn btn-sm btn-primary shadow-sm position-absolute address">
            0x277...a9A
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
export default {
  data() {
    return {
      connected: false,
      connectedGithub: false,
    }
  },
}
</script>

<style lang="sass">
  .wallet
    font-weight: bold
    padding-right: 100px
    .address
      top: 0
      right: 0
</style>
