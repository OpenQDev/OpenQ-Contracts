<template>
  <span>{{ shortenedAddress }}</span>
</template>

<script>
export default {
  props: ['address'],
  computed: {
    shortenedAddress() {
      return this.address.substr(0, 5) + '...' + this.address.substr(38)
    }
  }
}
</script>
