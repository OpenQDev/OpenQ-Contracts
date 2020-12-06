<template>
  <div>
    <a :href="user.url" target="_blank" class="avatar" :style="'background-image: url(' + user.avatarUrl + ')'"></a>
    <div class="embed rounded-bottom p-2 mb-2">
      <div class="d-flex justify-content-between">
        <b>{{ user.name }}</b>
        <font-awesome-icon :icon="['fab', 'github']" class="text-muted-light" />
      </div>
      <small class="d-flex justify-content-between text-muted mt-1">
        <span>ID:</span>
        <span>{{ user.id }}</span>
      </small>
      <small class="d-flex justify-content-between text-muted mt-1">
        <span>Signed up:</span>
        <span>{{ user.createdAt | moment("MMMM Do YYYY") }}</span>
      </small>
      <small class="d-flex justify-content-between text-muted mt-1">
        <span>Last active:</span>
        <span>{{ user.updatedAt | moment("MMMM Do YYYY") }}</span>
      </small>
    </div>
    <div class="btn btn-sm btn-light btn-block mb-2 d-flex align-items-center" v-if="address" v-clipboard="address" v-clipboard:success="copiedAddress">
      <font-awesome-icon :icon="['fab', 'ethereum']" class="text-muted" />
      <AddressShort :address="address" length="long" class="text-muted mr-auto ml-1" />
      <transition name="fade" mode="out-in">
        <font-awesome-icon :icon="['fas', 'check']" class="text-success" v-if="copyAddressSuccess" key="check" />
        <font-awesome-icon :icon="['far', 'copy']" class="text-muted" v-else key="copy" />
      </transition>
    </div>
  </div>
</template>

<style lang="sass">
.avatar
  border: solid 2px #ccc
  border-radius: 50%
  width: 32px
  height: 32px
  position: absolute
  z-index: 4
  top: 8px
  right: 10px
  background-repeat: no-repeat
  background-position: center center
  background-size: 100%
</style>

<script>
export default {
  props: ['user', 'address'],
  data() {
    return {
      copyAddressSuccess: false
    }
  },
  methods: {
    copiedAddress() {
      this.copyAddressSuccess = true
      setTimeout(() => {
        this.copyAddressSuccess = false
      }, 1000)
    }
  }
}
</script>
