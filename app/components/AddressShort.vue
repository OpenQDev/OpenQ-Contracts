<template>
  <span>{{ shortenedAddress }}</span>
</template>

<script>
export default {
  props: ['address', 'length'],
  computed: {
    shortenedAddress() {
      if (this.length === 'medium') {
        return this.address.substr(0, 12) + '...' + this.address.substr(32)
      } else if (this.length === 'long') {
        return this.address.substr(0, 17) + '...' + this.address.substr(28)
      } else {
        return this.address.substr(0, 5) + '...' + this.address.substr(38)
      }
    }
  }
}
</script>
