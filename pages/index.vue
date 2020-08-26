<template>
  <div>
    <transition name="fade" mode="out-in">
      <div class="card border-0 rounded-xl shadow" v-if="view == 'deposit'" key="deposit">
        <div class="d-flex justify-content-around mt-3">
          <span class="text-primary">Deposit</span>
          <a href="#" class="text-muted" @click="view = 'withdraw'">Withdraw</a>
        </div>
        <div class="card-body">
          <small class="text-muted d-flex justify-content-between">
            Issue or Pull Request
            <InfoIcon v-tooltip="'Paste the URL of the GitHub issue or pull request you want to deposit into.'" width="18px" height="18px" class="mb-1 info-icon" />
          </small>
          <input type="text" class="form-control form-control-lg mb-2" placeholder="https://github.com/..." />
          <small class="text-muted">Deposit amount</small>
          <div class="amount-input mb-2">
            <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" />
            <span>ETH</span>
          </div>
          <small class="text-muted d-flex justify-content-between">
            Lock up (optional)
            <InfoIcon v-tooltip="'Lock up deposits to shows commitment to contributors, rank higher in listings and earn merge coins to promote your projects. <a href=\'#\' target=\'_blank\'>learn more</a>'" width="18px" height="18px" class="mb-1 info-icon" />
          </small>
          <div class="amount-input mb-2">
            <input type="number" class="form-control form-control-lg mb-2" placeholder="0" />
            <span>Days</span>
          </div>
          <a href="#" class="btn btn-lg btn-primary shadow-sm d-block mt-4">
            Confirm
          </a>
        </div>
      </div>
      <div class="card border-0 rounded-xl shadow" v-if="view == 'withdraw'" key="withdraw">
        <div class="d-flex justify-content-around mt-3">
          <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
          <span class="text-primary">Withdraw</span>
        </div>
        <div class="card-body">
          <small class="text-muted d-flex justify-content-between">
            Issue or Pull Request
            <InfoIcon v-tooltip="'Paste the URL of the GitHub issue or pull request you want to withdraw from.'" width="18px" height="18px" class="mb-1 info-icon" />
          </small>
          <input type="text" class="form-control form-control-lg mb-2" placeholder="https://github.com/..." />
          <small class="text-muted d-flex justify-content-between">
            Amount to withdraw
          </small>
          <div class="amount-input mb-2">
            <input type="number" min="0" step="0.01" class="form-control form-control-lg mb-2" placeholder="0.00" />
            <span>ETH</span>
          </div>
          <a href="#" class="btn btn-lg btn-primary shadow-sm d-block mt-4">
            Withdraw
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
      view: 'deposit'
    }
  },
}
</script>

<style lang="sass" scoped>
  .card
    max-width: 420px
    min-width: 380px
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
