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
          <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" :disabled="!connected">
            Confirm
          </button>
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
          <a href="#" class="btn btn-lg btn-primary shadow-sm d-block mt-4" v-if="registered">
            Withdraw
          </a>
          <div v-else>
            <div class="alert alert-primary border-0 mt-4">
              <small>
                You are trying to withdraw a deposit for a merged pull request.
                To be eligible for this withdrawal you need to verify your GitHub
                account on the Ethereum blockchain by creating a repository named
                after your Ethereum address and then clicking on Register.
                Afterwards you can remove this repository again.<br>
                <div class="d-flex justify-content-between border border-primary rounded-lg px-2 py-1 mt-2">
                  <i class="my-auto">github.com/mktcode/0x27711...9E520</i>
                  <span class="p-1"><font-awesome-icon :icon="['far', 'copy']" /></span>
                </div>
              </small>
            </div>
            <a href="#" class="btn btn-lg btn-primary shadow-sm d-block mt-4" @click="registered = true">
              Register
            </a>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  transition: 'fade',
  data() {
    return {
      view: 'deposit',
      registered: false,
    }
  },
  computed: {
    ...mapGetters(['accounts', 'connected']),
  },
  mounted() {
    if (this.$web3) {
      this.$web3.eth.getAccounts().then(accounts => {
        this.$store.commit('setAccounts', accounts)
        this.$web3.eth.getBalance(accounts[0]).then(balance => this.$store.commit('setBalance', balance))
      })
    }
  }
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
