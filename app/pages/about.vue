<template>
  <div class="content content-wide text-white mt-5 pt-2">
    <nuxt-link to="/" class="text-white"><small class="text-white-50">go to app</small></nuxt-link>
    <h3 class="mt-2 mb-3">About OctoBay</h3>
    This is an experimental project, started at the end of August 2020. The goal was to learn smart contract development and to deploy a somewhat useful one to the Etherem main network (soon), together with an app that makes interaction easy.<br>
    <br>
    OctoBay offers a simple way to reward contributors on GitHub with ETH or just send it any GitHub account.
    Anyone can deposit funds on any issue and the repository owner can decide to release the funds or to refund the depositers.
    <h5 class="mt-3 mb-2">OctoPin Tokens (OPIN)</h5>
    OctoPin tokens can only be minted by developers, who submit their merged pull requests and projects can use them to promote their issues.
    <h5 class="mt-3 mb-2">Possible Improvements</h5>
    Possible improvements are ENS integration, a better oracle system (chainlink), ERC20 support, a GitHub and email bot and more promotion features for projects.
    Ideas are really not the problem.
    Professional security audits and code reviews will happen as soon as possible and viable.
    <h5 class="mt-3 mb-2">Known Problems</h5>
    There are several known problems, that render this project anything but professional.
    <div class="alert alert-primary mt-2">
      <ul class="m-0 pl-3">
        <li>naiv centralized <a href="https://github.com/mktcode/octobay-website/tree/master/api/controllers/oracle" target="_blank">oracle implementation</a></li>
        <li>stupid and unfair <a href="https://github.com/mktcode/octobay-website/blob/master/api/controllers/oracle/claim.js#L59" target="_blank">pull request scores</a></li>
        <li>cheap <a href="https://uberspace.de" target="_blank">hosting</a> (but actually I like these guys)</li>
        <li>this nasty <a href="https://github.com/mktcode/octobay-website/issues/5" target="_blank">issue</a>... working on it...</li>
        <li>documentation? ehhh...</li>
        <li>and probably a lot more.</li>
      </ul>
    </div>
    <h5 class="mt-3 mb-2">Donate</h5>
    Send some ETH or Tokens, if you'd like to support this idea.
    <div class="d-flex">
      <div class="btn btn-light d-flex align-items-center flex-column mt-4 mx-auto p-0 shadow-sm" v-clipboard="'0x27711f9c07230632F2EE1A21a967a9AC4729E520'" v-clipboard:success="copiedAddress">
        <img src="/donate-address-qr.png" />
        <div class="mt-1 mb-2">
          <AddressShort address="0x27711f9c07230632F2EE1A21a967a9AC4729E520" class="text-muted mr-auto ml-1" />
          <transition name="fade" mode="out-in">
            <font-awesome-icon :icon="['fas', 'check']" class="text-success" v-if="copyAddressSuccess" key="check" />
            <font-awesome-icon :icon="['far', 'copy']" class="text-muted" v-else key="copy" />
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  transition: 'fade',
  layout: 'about',
  data() {
    return {
      copyAddressSuccess: false
    }
  },
  methods: {
    copiedAddress() {
      this.copyAddressSuccess = true
      setTimeout(() => {
        this.copyAddressSuccess = false
      }, 1000)
    }
  }
}
</script>
