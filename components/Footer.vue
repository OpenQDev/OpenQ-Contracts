<template>
  <footer class="pt-5 pb-5">
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
