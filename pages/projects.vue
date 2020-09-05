<template>
  <div class="container">
    <div class="row" v-for="i in 3">
      <div class="col" v-for="i in 3">
        <div class="card border-0 rounded-xl shadow mb-4">
          <img src="https://invezz.com/wp-content/uploads/2020/07/chainlink-spares-no-expense-when-it-comes-to-development-1280x720.jpg" class="card-img-top" alt="project title">
          <div class="card-body">
            <h4>ChainLink</h4>
            Your smart contracts connected to real world data, events and payments.
            <div class="text-right mt-3">
              <a href="#" class="btn btn-primary shadow-sm ml-2">Deposits</a>
              <a href="#" class="btn btn-light shadow-sm">
                Website
                <small>
                  <font-awesome-icon :icon="['fas', 'external-link-alt']" />
                </small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  transition: 'fade',
  data() {
    return {
      view: 'deposit'
    }
  },
}
</script>

<style lang="sass" scoped>
  .card
    overflow: hidden
    .info-icon
      opacity: 0.6
      cursor: pointer
    .amount-input
      position: relative
      span
        font-size: 1.5rem
        position: absolute
        right: 50px
        top: 8px
        opacity: 0.4
</style>
