<template>
  <footer class="pt-3 pb-5">
    <div class="mb-5">
      <a href="#" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a href="#" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'github']" />
      </a>
      <a href="#" class="text-muted px-2">
        <font-awesome-icon :icon="['fab', 'ethereum']" />
      </a>
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
</style>
