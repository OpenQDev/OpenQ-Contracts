<template>
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
</template>

<script>
export default {
  data() {
    return {
      registered: false,
    }
  },
}
</script>
