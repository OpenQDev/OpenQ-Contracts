<template>
  <div>
    <transition name="fade" mode="out-in">
      <div class="content content-wide card border-0 rounded-xl shadow" v-if="view == 'open'" key="open">
        <div class="d-flex justify-content-around mt-3">
          <span class="text-primary">Open</span>
          <a href="#" class="text-muted" @click="view = 'history'">History</a>
        </div>
        <div class="card-body p-0">
          <div class="issue-list">
            <a href="#" target="_blank" class="d-flex justify-content-between p-3 m-3 rounded-lg" v-for="i in 5">
              <div class="my-auto text-truncate">
                Improve customization by allowing manually setting calculated variables in styles<br>
                <small class="text-muted">twbs/bootstrap/issues/31538</small>
              </div>
              <div class="ml-3 px-3 text-nowrap border-left text-center d-flex flex-column justify-content-center">
                <h4 class="mb-0">{{ (5 / i).toFixed(2) }} ETH</h4>
                <small class="text-muted" v-if="i != 5">(locked {{ 23 - i }} days)</small>
              </div>
              <div class="my-auto d-flex flex-column">
                <a href="#" class="btn btn-sm btn-light mb-1">
                  <font-awesome-icon :icon="['fas', 'angle-double-right']" />
                </a>
                <a href="#" :class="['btn btn-sm btn-light', { disabled: i != 5 }]">
                  <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
                </a>
              </div>
            </a>
          </div>
          <a href="#" class="btn btn-primary d-block text-center m-3">
            load more
          </a>
        </div>
      </div>
      <div class="content content-wide card border-0 rounded-xl shadow" v-if="view == 'history'" key="history">
        <div class="d-flex justify-content-around mt-3">
          <a href="#" class="text-muted" @click="view = 'open'">Open</a>
          <span class="text-primary">History</span>
        </div>
        <div class="card-body p-0">
          <div class="issue-list">
            <a href="#" target="_blank" class="d-flex justify-content-between p-3 m-3 rounded-lg" v-for="i in 5">
              <div class="my-auto text-truncate">
                Improve customization by allowing manually setting calculated variables in styles<br>
                <small class="text-muted">twbs/bootstrap/issues/31538</small>
              </div>
              <div class="ml-3 pl-3 text-nowrap border-left text-center">
                <h4 class="mb-0 text-muted">{{ (5 / i).toFixed(2) }} ETH</h4>
                <div class="text-danger"><small>withdrawn 08/26/2020</small></div>
                <div class="text-muted"><small>({{ i % 3 ? 'by you' : 'by contributor' }})</small></div>
              </div>
            </a>
          </div>
          <a href="#" class="btn btn-primary d-block text-center m-3">
            load more
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  transition: 'fade',
  data() {
    return {
      view: 'open'
    }
  },
}
</script>

<style lang="sass" scoped>
  .issue-list
    > a
      border: solid 1px #eee
      color: #333
      &:hover
        border-color: transparent
        background: #0366d6
        color: white
        .text-muted,
        .text-danger
          color: white !important
  </style>
