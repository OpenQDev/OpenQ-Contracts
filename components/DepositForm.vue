<template>
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
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-if="connected">
      Confirm
    </button>
    <button class="btn btn-lg btn-primary shadow-sm d-block w-100 mt-4" v-else-if="$web3" @click="connect()">
      Connect
    </button>
  </div>
</div>
</template>

<script>
import { mapGetters } from "vuex"
import connect from '@/mixins/connect'

export default {
  mixins: [connect],
  computed: {
    ...mapGetters(['connected']),
  },
}
</script>
