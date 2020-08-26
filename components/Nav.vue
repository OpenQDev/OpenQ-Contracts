<template>
  <div class="mx-auto mt-4 mb-5">
    <nuxt-link to="/" class="text-dark px-2">
      Transfer
    </nuxt-link>
    <nuxt-link to="/deposits" class="text-dark px-2">
      My Deposits
    </nuxt-link>
    <nuxt-link to="/issues" class="text-dark px-2">
      Open Issues
    </nuxt-link>
    <nuxt-link to="/projects" class="text-dark px-2">
      Projects
    </nuxt-link>
  </div>
</template>

<style lang="sass" scoped>
.nuxt-link-exact-active
  color: #0366d6 !important
  &:hover,
  &:focus,
  &:active
    color: #0366d6 !important
</style>
