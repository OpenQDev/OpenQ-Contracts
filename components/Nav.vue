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
      <span class="badge badge-primary badge-pill font-weight-normal">
        soon
      </span>
    </nuxt-link>
  </div>
</template>

<style lang="sass" scoped>
a
  position: relative
  &.nuxt-link-exact-active
    color: #0366d6 !important
    &:hover,
    &:focus,
    &:active
      color: #0366d6 !important
  .badge
    position: absolute
    top: -5px
    right: 0
    padding: 0.1rem 0.3rem
    font-size: 11px
</style>
