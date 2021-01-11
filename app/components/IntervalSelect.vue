<template>
  <transition name="fade" mode="in-out">
    <div class="overlay" v-if="showIntervalSelect" @click="$store.commit('setShowIntervalSelect', false);">
      <div class="card shadow-sm recipient-list" @click.stop>
        <div class="card-body p-2">
          <h5 class="text-center text-muted-light py-3 px-5">In what interval do you want to release funds to the recipient?</h5>
          <div :class="'mt-2 d-flex justify-content-center align-items-center btn btn-' + (selectedInterval == 'Days' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedInterval', 'Days'); $store.commit('setShowIntervalSelect', false)">
            Daily
          </div>
          <div :class="'mt-2 d-flex justify-content-center align-items-center btn btn-' + (selectedInterval == 'Weeks' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedInterval', 'Weeks'); $store.commit('setShowIntervalSelect', false)">
            Weekly
          </div>
          <div :class="'mt-2 d-flex justify-content-center align-items-center btn btn-' + (selectedInterval == 'Months' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedInterval', 'Months'); $store.commit('setShowIntervalSelect', false)">
            Monthly
          </div>
          <div :class="'mt-2 d-flex justify-content-center align-items-center btn btn-' + (selectedInterval == 'Years' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedInterval', 'Years'); $store.commit('setShowIntervalSelect', false)">
            Yearly
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="sass" scoped>
.overlay
  position: fixed
  top: 0
  right: 0
  bottom: 0
  left: 0
  z-index: 5
  background: rgba(0, 0, 0, 0.5)
.recipient-list
  position: absolute
  top: 35%
  left: 50%
  margin-left: -180px
  width: 360px
  z-index: 6
  .card-body
    overflow: auto
</style>

<script>
import {
  mapGetters
} from "vuex"

export default {
  data() {
    return {
      tokenSearch: '',
      showNum: 25
    }
  },
  computed: {
    ...mapGetters(['showIntervalSelect', 'selectedInterval'])
  }
}
</script>
