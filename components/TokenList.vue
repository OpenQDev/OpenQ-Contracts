<template>
  <transition name="fade" mode="in-out">
    <div class="overlay" v-if="showTokenList" @click="$store.commit('setShowTokenList', false); showNum = 25">
      <div class="card shadow-sm rounded-xl token-list" @click.stop>
        <div class="card-header border-0 p-2">
          <input type="text" class="form-control form-control-lg rounded-xl" placeholder="Enter token name or address" v-model="tokenSearch" />
        </div>
        <div class="card-body p-2">
          <div class="btn btn-outline-light text-dark mt-2 text-left rounded-xl d-flex align-items-center" @click="$store.commit('setSelectedToken', null); $store.commit('setShowTokenList', false); showNum = 25">
            <img src="/eth-logo.png" width="25" height="25" class="rounded-circle" />
            <div class="ml-2 text-truncate d-flex flex-column">
              Ether (ETH)
            </div>
          </div>
          <div v-for="token in filteredTokenList" class="btn btn-outline-light text-dark mt-2 text-left rounded-xl d-flex align-items-center" @click="$store.commit('setSelectedToken', token); $store.commit('setShowTokenList', false); showNum = 25">
            <img :src="token.logoURI" width="25" height="25" class="rounded-circle" />
            <div class="ml-2 text-truncate d-flex flex-column">
              {{ token.name }} ({{ token.symbol }})
              <small class="text-muted text-truncate">{{ token.address }}</small>
            </div>
          </div>
          <button class="btn btn-outline-light text-dark rounded-xl btn-block my-2" @click="showNum += 25" v-if="!tokenSearch">
            Show more
          </button>
        </div>
        <small class="card-footer p-2 text-center text-muted">
          <img :src="tokenList.logoURI" width="20" height="20" class="rounded-circle" />
          {{ tokenList.name }}
        </small>
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
.token-list
  position: absolute
  top: 5%
  bottom: 5%
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
    ...mapGetters(['tokenList', 'showTokenList']),
    filteredTokenList() {
      const search = this.tokenSearch.toLowerCase()
      return this.tokenSearch ?
        this.tokenList.tokens.filter(token => token.name.toLowerCase().includes(search) || token.address.toLowerCase().includes(search)).splice(0, this.showNum) :
        this.tokenList.tokens.filter(token => token).splice(0, this.showNum)
    }
  }
}
</script>
