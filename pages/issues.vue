<template>
  <div>
    <transition name="fade" mode="out-in">
      <div class="content content-wide card border-0 rounded-xl shadow" v-if="view == 'top'" key="top">
        <div class="d-flex justify-content-around mt-3">
          <span class="text-primary">Top</span>
          <a href="#" class="text-muted" @click="view = 'new'">New</a>
        </div>
        <div class="card-body p-0">
          <div class="issue-list">
            <a class="d-flex justify-content-between p-3 m-3 rounded-lg" v-for="i in 5">
              <div class="my-auto text-truncate">
                Improve customization by allowing manually setting calculated variables in styles<br>
                <small class="text-muted">twbs/bootstrap/issues/31538</small><br>
                <span class="badge badge-pill badge-primary">javascript</span>
                <span class="badge badge-pill badge-primary">css</span>
                <span class="badge badge-pill badge-primary">solidity</span>
              </div>
              <div class="ml-3 pl-3 text-nowrap border-left text-center d-flex flex-column">
                <h4 class="mb-0">{{ (5 / i).toFixed(2) }} ETH</h4>
                <small class="text-muted">added 08/20/2020</small>
                <small class="text-muted">locked {{ 23 - i }} days</small>
              </div>
            </a>
          </div>
          <div class="m-3">
            <button class="btn btn-primary text-center btn-block" disabled>
              Comming soon!
            </button>
          </div>
        </div>
      </div>
      <div class="content content-wide card border-0 rounded-xl shadow" v-if="view == 'new'" key="new">
        <div class="d-flex justify-content-around mt-3">
          <a href="#" class="text-muted" @click="view = 'top'">Top</a>
          <span class="text-primary">New</span>
        </div>
        <div class="card-body p-0">
          <div class="issue-list">
            <a class="d-flex justify-content-between p-3 m-3 rounded-lg" v-for="i in 5">
              <div class="my-auto text-truncate">
                Improve customization by allowing manually setting calculated variables in styles<br>
                <small class="text-muted">twbs/bootstrap/issues/31538</small><br>
                <span class="badge badge-pill badge-primary">javascript</span>
                <span class="badge badge-pill badge-primary">solidity</span>
              </div>
              <div class="ml-3 pl-3 text-nowrap border-left text-center d-flex flex-column">
                <h4 class="mb-0">{{ (1 / i).toFixed(2) }} ETH</h4>
                <small class="text-muted">added 08/20/2020</small>
                <small class="text-muted">locked {{ 23 - i }} days</small>
              </div>
            </a>
          </div>
          <div class="m-3">
            <button class="btn btn-primary text-center btn-block" disabled>
              Comming soon!
            </button>
          </div>
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
      view: 'top'
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
        .badge-pill
          background: white
          color: #0366d6
  </style>
