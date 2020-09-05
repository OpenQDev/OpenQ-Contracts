<template>
  <div class="overflow-hidden">
    <div class="container-fluid main d-flex flex-column align-items-center pb-5">
      <div class="alert alert-warning border-0 mt-5" v-if="!$web3">
        You need an Ethereum compatible browser or browser extension to use this service.<br>
        We suggest installing the <a href="https://metamask.io" target="_blank">MetaMask extension</a>.
      </div>
      <Header />
      <Nuxt />
      <Footer />
    </div>
    <About />
  </div>
</template>
