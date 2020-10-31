<template>
  <div class="d-flex justify-content-center">
    <nuxt-link to="/" class="text-dark px-2">
      Transfer
    </nuxt-link>
    <nuxt-link to="/deposits" class="text-dark px-2">
      Deposits
    </nuxt-link>
    <nuxt-link to="/issues" class="text-dark px-2">
      Issues
    </nuxt-link>
    <!-- <nuxt-link to="/projects" class="text-muted px-2">
      Projects
      <span class="badge badge-primary badge-pill font-weight-normal">
        soon
      </span>
    </nuxt-link>
    <a href="#" class="text-muted px-2">
      Developers
      <span class="badge badge-primary badge-pill font-weight-normal">
        soon
      </span>
    </a> -->
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
