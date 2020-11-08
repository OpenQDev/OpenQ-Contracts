<template>
  <div class="content content-wide text-white mt-5 pt-2">
    <nuxt-link to="/" class="text-white"><small class="text-white-50">go to app</small></nuxt-link>
    <h3 class="mt-2 mb-3">About OctoPay</h3>
    This is an experimental project, started at the end of August 2020. The goal was to learn smart contract development and to deploy a somewhat useful one to the Etherem main network, together with an app that makes interaction easy.<br>
    <br>
    OctoPay offers a simple way to reward contributors on GitHub with ETH and ERC20 tokens and send them around between GitHub accounts.
    Anyone can deposit funds on any issue and the repository owner can decide to release the funds or to refund the depositers.
    <h5 class="mt-3 mb-2">Pin Tokens (PIN)</h5>
    PINs can only be minted by developers, who submit their merged pull requests.
    They can convert them to reputation or sell them on the market, as projects need them to pin issues on the pin board.
    <h5 class="mt-3 mb-2">Next Steps</h5>
    Possible improvements are an ENS integration, a better oracle system (maybe chainlink), ERC20 deposits, a governance mechanism for system parameters, a GitHub and email bot and in general better promotional features for projects and more token use cases.
    Professional security audits and code reviews will happen as soon as possible and viable.
    <h5 class="mt-3 mb-2">Donate</h5>
    Help me to grow and evolve this and other projects and enable a more professional development:
    <div class="text-center text-white-50 my-3">
      0x27711f9c07230632F2EE1A21a967a9AC4729E520
    </div>
    <div class="text-center my-4">
      <img src="/donate-address-qr.png" class="rounded-xl p-2 bg-white" />
    </div>
  </div>
</template>

<script>
export default {
  transition: 'fade',
  layout: 'about'
}
</script>
