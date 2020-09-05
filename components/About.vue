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
          <a href="#" class="text-white mx-2">About</a>
          <a href="#" class="text-white-50 mx-2">Token</a>
          <a href="#" class="text-white-50 mx-2">Promotions</a>
          <a href="#" class="text-white-50 mx-2">FAQ</a>
        </div>
        <div class="row">
          <div class="col text-left">
            <Logo color="white" size="xl" />
            <p class="lead mt-4">
              MergePay offers an easy and secure way to reward contributors with ETH.
              Anyone can deposit ETH on any issue or pull request. Contributors can withdraw
              these deposits, if all conditions are met, an thereby farm Merge Tokens for the
              respective depositers and themselves. These tokens can be used for promotion or
              staked to profit from our service fees.
            </p>
            <div class="pt-5">
              <button href="#" class="btn btn-lg btn-light rounded-xl shadow-sm d-flex flex-column px-4 mx-auto">
                <span>Buy Merge Tokens</span>
                <small><sup class="text-muted">Presale starts 10/01/20</sup></small>
              </button>
            </div>
          </div>
          <div class="col d-flex justify-content-center align-items-center flex-column text-center">
            <h1 class="font-weight-normal">Earn by contributing,<br>supporting projects<br>and staking.</h1>
            <h1 class="font-weight-normal mt-5">Reach devs with<br>rewards and promotions.</h1>
          </div>
        </div>
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
      open: false
    }
  }
}
</script>
