<template>
  <transition name="fade" mode="in-out">
    <div class="overlay" v-if="showRecipientTypeList" @click="$store.commit('setShowRecipientTypeList', false);">
      <div class="card shadow-sm rounded-xl recipient-list" @click.stop>
        <div class="card-body p-2">
          <h5 class="text-center text-muted-light py-3 px-5">Where do you want to send funds?</h5>
          <div :class="'mt-2 text-left rounded-xl d-flex align-items-center btn btn-' + (selectedRecipientType == 'User' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedRecipientType', 'User'); $store.commit('setShowRecipientTypeList', false)">
            <font-awesome-icon :icon="['fas', 'user']" class="fa-2x mx-2" />
            <div class="ml-2 d-flex flex-column">
              User
              <small :class="'text-' + (selectedRecipientType == 'User' ? 'white' : 'muted')">Send funds to any GitHub account and oboard new users to Ethereum.</small>
            </div>
          </div>
          <div :class="'mt-2 text-left rounded-xl d-flex align-items-center btn btn-' + (selectedRecipientType == 'Issue' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedRecipientType', 'Issue'); $store.commit('setShowRecipientTypeList', false);">
            <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="fa-2x mx-2" />
            <div class="ml-2 d-flex flex-column">
              Issue
              <small :class="'text-' + (selectedRecipientType == 'Issue' ? 'white' : 'muted')">Deposit funds on GitHub issues. Either on your own ones or support others and onboard new projects.</small>
            </div>
          </div>
          <div :class="'mt-2 text-left rounded-xl d-flex align-items-center btn btn-' + (selectedRecipientType == 'Project' ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setSelectedRecipientType', 'Project'); $store.commit('setShowRecipientTypeList', false);">
            <font-awesome-icon :icon="['fas', 'code']" class="fa-2x mx-2" />
            <div class="ml-2 d-flex flex-column">
              Project
              <small :class="'text-' + (selectedRecipientType == 'Project' ? 'white' : 'muted')">Send funds to any Repository on GitHub. Can only be used to fund issue.</small>
            </div>
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
    ...mapGetters(['showRecipientTypeList', 'selectedRecipientType'])
  }
}
</script>
