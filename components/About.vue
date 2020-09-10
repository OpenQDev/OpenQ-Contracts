<template>
  <div :class="['about text-white', { open }]">
    <div class="shadow-gradient"></div>
    <a href="#" class="scroll show-about text-center" @click="open = true">
      <small class="d-block mt-1">
        <font-awesome-icon :icon="['fas', 'chevron-down']" />
      </small>
    </a>
    <a href="#" class="scroll show-app text-center" @click="open = false">
      <small class="d-block">
        <font-awesome-icon :icon="['fas', 'chevron-up']" />
      </small>
    </a>
    <div class="container-fluid pt-5">
      <div class="container">
        <div class="text-center mt-4 mb-5">
          <a href="#" :class="'mx-2 text-white' + (view == 'about' ? '' : '-50')" @click="view = 'about'">About</a>
          <a href="#" :class="'mx-2 text-white' + (view == 'merge-token' ? '' : '-50')" @click="view = 'merge-token'">Merge Token</a>
          <a href="#" :class="'mx-2 text-white' + (view == 'sendreceive' ? '' : '-50')" @click="view = 'sendreceive'">Sending &amp; Receiving</a>
          <a href="#" :class="'mx-2 text-white' + (view == 'depositwithdraw' ? '' : '-50')" @click="view = 'depositwithdraw'">Deposits &amp; Withdrawals</a>
          <a href="#" :class="'mx-2 text-white' + (view == 'promo' ? '' : '-50')" @click="view = 'promo'">Promotions</a>
          <a href="#" :class="'mx-2 text-white' + (view == 'faq' ? '' : '-50')" @click="view = 'faq'">FAQ</a>
        </div>
        <transition name="fade" mode="out-in">
          <div v-if="view == 'about'" key="about">
            <div class="row">
              <div class="col text-left">
                <Logo color="white" size="xl" />
                <p class="lead mt-4">
                  MergePay offers an easy and secure way to reward contributors with ETH.
                  You can send ETH to any GitHub username and anyone can make ETH deposits on any issue or pull request, which contributors can withdraw, if the conditions are met.
                </p>
                <p class="lead">
                  Whenever ETH is transferred using MergePay, Merge Tokens are farmed for everybody involved in the transfer.
                  Also every new GitHub user that registers on MergePay gets Merge Token in exchange for the registration fee of 0.01 ETH.
                  Merge Tokens can be used by developers to claim issues or for promotional purposes on the platform, you can stake them
                  to directly profit from our service fees or simply trade them on the open market.
                </p>
              </div>
              <div class="col d-flex justify-content-center align-items-center flex-column text-center claims">
                <h1 class="font-weight-normal">Earn by contributing, supporting projects and staking...</h1>
                <h1 class="font-weight-normal mt-4">...or reach devs with rewards and promotions.</h1>
              </div>
            </div>
          </div>
          <div v-else-if="view == 'merge-token'" key="merge-token">
            <div class="row">
              <div class="col">
                <h1>Merge Token</h1>
                <div class="pt-5">
                  <button href="#" class="btn btn-lg btn-light rounded-xl shadow-sm d-flex flex-column px-4 mx-auto">
                    <span>Buy Merge Tokens</span>
                    <small><sup class="text-muted">Presale starts 10/01/20</sup></small>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else key="something">
            <div class="row">
              <div class="col">
                <h1>...</h1>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style lang="sass">
@mixin inner-rounding
  content: ''
  position: absolute
  background: -webkit-radial-gradient(0 100%, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(100% 100%, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(100% 0, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(0 0, circle, rgba(204,0,0,0) 14px, #fff 15px)
  background-position: bottom left, bottom right, top right, top left
  background-size: 50% 50%
  background-size: 50% 50%
  background-repeat: no-repeat
  width: 28px
  padding: 15px 7px

.about
  background: rgb(0,23,85)
  background: linear-gradient(90deg, rgba(0,23,85,1) 0%, rgba(0,74,157,1) 40%, rgba(0,74,157,1) 60%, rgba(0,23,85,1) 100%)
  border-top: solid 4px white
  position: absolute
  margin-top: -4px
  top: 100vh
  left: 0
  right: 0
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.3)
  z-index: 2
  transition: top 1s cubic-bezier(0.76, 0, 0.24, 1)
  height: 100vh
  .logo
    text-shadow: 0 0 15px rgba(0, 0, 0, 0.8)
  .claims
    text-shadow: 0 0 15px rgba(0, 0, 0, 0.8)
  .shadow-gradient
    position: absolute
    top: 0
    left: 0
    right: 0
    height: 25px
    background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%)
  > .container-fluid
    height: 100vh
    overflow: auto
    opacity: 0
    transition: opacity 1s ease
    transition-delay: .5s
    position: relative
    z-index: 0
  &.open
    top: 4px
    > .container-fluid
      opacity: 1
  .scroll
    width: 76px
    height: 25px
    position: absolute
    left: 50%
    margin-left: -38px
    background: white
    color: #999
    z-index: 3
    &.show-about
      margin-top: -29px
      border-top-left-radius: 25px
      border-top-right-radius: 25px
      &:before
        @include inner-rounding
        bottom: -15px
        left: -11px
        clip: rect(0 14px 15px 0px)
      &:after
        @include inner-rounding
        bottom: -15px
        right: -11px
        clip: rect(0 28px 15px 14px)
    &.show-app
      border-bottom-left-radius: 25px
      border-bottom-right-radius: 25px
      &:before
        @include inner-rounding
        top: -15px
        left: -11px
        clip: rect(15px 14px 30px 0px)
      &:after
        @include inner-rounding
        top: -15px
        right: -11px
        clip: rect(15px 28px 30px 14px)
    &:hover
      background-color: white !important
      color: #0366d6 !important
      &:before,
      &:after
        background: -webkit-radial-gradient(0 100%, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(100% 100%, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(100% 0, circle, rgba(204,0,0,0) 14px, #fff 15px), -webkit-radial-gradient(0 0, circle, rgba(204,0,0,0) 14px, #fff 15px)
        background-position: bottom left, bottom right, top right, top left
        background-size: 50% 50%
        background-size: 50% 50%
        background-repeat: no-repeat
</style>

<script>
export default {
  data() {
    return {
      open: false,
      view: 'about'
    }
  }
}
</script>
