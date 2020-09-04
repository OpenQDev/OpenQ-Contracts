<template>
  <div :class="['about text-white bg-primary', { open }]">
    <div class="shadow-gradient"></div>
    <a href="#" class="scroll show-about text-center" @click="open = true">
      <small class="d-block mt-1">About</small>
    </a>
    <a href="#" class="scroll show-app text-center" @click="open = false">
      <small class="d-block">App</small>
    </a>
    <div class="container-fluid pt-5">
      <div class="container">
        <div class="row">
          <div class="col text-left">
            <Logo color="white" size="xl" />
            <p class="lead">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
            </p>
          </div>
          <div class="col d-flex justify-content-center align-items-center flex-column">
            <h1>Pay Contributors</h1>
            <h1>Farm MergeCoin Tokens</h1>
            <h1>Promote your Project</h1>
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
    overflow-y: scroll
    opacity: 0
    transition: opacity 1s ease
    transition-delay: .5s
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
