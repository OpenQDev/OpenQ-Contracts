<template>
  <div class="container-fluid main d-flex flex-column align-items-center pb-5">
    <div class="alert alert-info border-0 mt-3" v-if="showWarning" style="max-width: 480px">
      <button type="button" class="close" @click="showWarning = false">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </button>
      <font-awesome-icon :icon="['fas', 'exclamation-triangle']" /> <b>This project is experimental!</b>
      <div class="mt-2 d-flex flex-column">
        <div>
          Please connect to the <b>Kovan</b> test network, try things out (spot the bugs) and share your thoughts.<br>
          This is an open source project, open for ideas of any kind.
        </div>
        <div class="d-flex mt-2">
          <nuxt-link to="/about" class="flex-fill btn btn-sm btn-primary">
            Read more
          </nuxt-link>
          <a href="https://discord.gg/DhKgHrFeCD" target="_blank" class="ml-1 btn btn-sm btn-primary">
            <font-awesome-icon :icon="['fab', 'discord']" />
          </a>
          <a href="https://twitter.com/OctoBayApp" target="_blank" class="ml-1 btn btn-sm btn-primary">
            <font-awesome-icon :icon="['fab', 'twitter']" />
          </a>
          <a href="https://gitter.im/kovan-testnet/faucet" target="_blank" class="ml-1 btn btn-sm btn-primary" v-tooltip="{ content: 'Kovan Faucet', trigger: 'hover' }">
            <font-awesome-icon :icon="['fas', 'faucet']" />
          </a>
          <a href="https://github.com/mktcode/octobay-website/issues/new" target="_blank" class="ml-1 btn btn-sm btn-primary" v-tooltip="{ content: 'New Issue', trigger: 'hover' }">
            <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
          </a>
        </div>
      </div>
    </div>
    <Header />
    <Nuxt />
    <Footer />
  </div>
</template>

<script>
export default {
  data() {
    return {
      showWarning: true
    }
  }
}
</script>
