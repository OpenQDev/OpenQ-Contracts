<template>
  <div class="container-fluid main d-flex flex-column align-items-center pb-5">
    <div class="alert alert-danger border-0 mt-3" v-if="showWarning" style="max-width: 480px">
      <button type="button" class="close" @click="showWarning = false">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </button>
      <font-awesome-icon :icon="['fas', 'exclamation-triangle']" /> <b>Warning</b>
      <div class="mt-2">
        This project is experimental!
        No security audits or other quality assuring measures have taken place.
        Use this service only with money you can afford to lose or when connected to the <b>Kovan</b> test network.
        <nuxt-link to="/about">Read more.</nuxt-link>
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
