<template>
  <transition name="fade" mode="in-out">
    <div class="overlay" v-if="showOracleList" @click="$store.commit('setShowOracleList', false);">
      <div class="card shadow-sm rounded-xl oracle-list" @click.stop>
        <div class="card-body p-2">
          <h5 class="text-center text-muted-light py-3 px-5">Do you want to support a certain oracle?</h5>
          <div :class="'mt-2 text-left rounded-xl d-flex align-items-center btn btn-' + (activeOracle == null ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setActiveOracle', null); $store.commit('setShowOracleList', false)">
            <font-awesome-icon :icon="['fas', 'dice']" class="fa-2x mx-2" />
            <div class="ml-2 d-flex flex-column">
              Random
              <small :class="'text-' + (activeOracle == null ? 'white' : 'muted')">For every action that involves an oracle, choose a random one.</small>
            </div>
          </div>
          <div v-for="oracle in oracles" :class="'mt-2 text-left rounded-xl d-flex align-items-center btn btn-' + (activeOracle == oracle ? 'primary' : 'outline-light text-dark')" @click="$store.commit('setActiveOracle', oracle); $store.commit('setShowOracleList', false)">
            <font-awesome-icon :icon="['fas', 'user']" class="mx-2 fa-2x" />
            <div class="ml-2 mr-auto d-flex flex-column">
              {{ oracle.name }}
              <small>$0.24/Request</small>
            </div>
            <div class="d-flex flex-column align-items-end pr-3">
              <small>Reliability:</small>
              <b>99.99 %</b>
              <small>(1681/1682)</small>
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
.oracle-list
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
  computed: {
    ...mapGetters(['showOracleList', 'activeOracle', 'oracles'])
  }
}
</script>
