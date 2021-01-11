<template>
  <div class="border rounded-xl px-1" style="margin-top: -56px; padding-top: 56px;">
    <a :href="user.url" target="_blank" class="avatar" :style="'background-image: url(' + user.avatarUrl + ')'"></a>
    <div class="embed rounded-top pb-3 px-2">
      <div class="d-flex justify-content-between">
        <b class="text-nowrap text-truncate">{{ user.name }}</b>
        <div class="text-nowrap">
          <div class="btn btn-sm btn-light" v-if="address" v-clipboard="address" v-clipboard:success="copiedAddress" v-tooltip="{content: address.substr(0, 12) + '...' + address.substr(32), trigger: 'hover'}">
            <transition name="fade" mode="out-in">
              <span v-if="copyAddressSuccess" class="text-muted">
                copied <font-awesome-icon :icon="['fas', 'check']" class="text-success" fixed-width />
              </span>
              <font-awesome-icon :icon="['fab', 'ethereum']" class="text-muted" v-else fixed-width />
            </transition>
          </div>
          <a :href="'mailto:' + user.email" v-if="user.email" class="btn btn-sm btn-light text-muted">
            <font-awesome-icon :icon="['fas', 'envelope']" fixed-width />
          </a>
          <a :href="'https://twitter.com/' + user.twitterUsername" v-if="user.twitterUsername" target="_blank" class="btn btn-sm btn-light text-muted">
            <font-awesome-icon :icon="['fab', 'twitter']" fixed-width />
          </a>
          <a :href="user.websiteUrl" v-if="user.websiteUrl" target="_blank" class="btn btn-sm btn-light text-muted">
            <font-awesome-icon :icon="['fas', 'globe-americas']" fixed-width />
          </a>
        </div>
      </div>
      <small class="d-flex justify-content-between text-muted mt-1">
        <span>GitHub user since:</span>
        <span>{{ user.createdAt | moment("MMMM Do YYYY") }}</span>
      </small>
      <small class="d-flex justify-content-between text-muted mt-1">
        <span>Last seen:</span>
        <span>{{ $moment(user.updatedAt).fromNow() }}</span>
      </small>
    </div>
  </div>
</template>

<style lang="sass" scoped>
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
