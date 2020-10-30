<template>
  <div :class="['logo', { 'logo-xl': size == 'xl', 'logo-lg': size == 'lg', 'text-white': color == 'white', 'text-dark': color == 'dark' }]">
    <div>
      <img :src="color == 'white' ? '/logo-white.png' : '/logo.png'" :width="size == 'xl' ? 70 : (size == 'lg' ? 50 : 30)" />
      MergePay
    </div>
  </div>
</template>

<style lang="sass">
.logo
  font-family: 'Cinzel', serif
  font-size: 1.5rem
  img
    opacity: 0.8
  &.logo-lg
    font-size: 2rem
  &.logo-xl
    font-size: 4rem
    img
      opacity: 1
</style>

<script>
export default {
  props: ['size', 'color']
}
</script>
