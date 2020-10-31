<template>
  <div class="content card border-0 rounded-xl shadow">
    <div class="d-flex justify-content-around mt-3" v-if="view == 'deposit'">
      <a href="#" class="text-muted" @click="view = 'send'">Send</a>
      <span class="text-primary">Deposit</span>
      <a href="#" class="text-muted" @click="view = 'withdraw'">
        {{ registeredAccount === account ? 'Withdraw' : 'Register' }}
      </a>
    </div>
    <div class="d-flex justify-content-around mt-3" v-else-if="view == 'withdraw'">
      <a href="#" class="text-muted" @click="view = 'send'">Send</a>
      <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
      <span class="text-primary">
        {{ registeredAccount === account ? 'Withdraw' : 'Register' }}
      </span>
    </div>
    <div class="d-flex justify-content-around mt-3" v-else-if="view == 'send'">
      <span class="text-primary">Send</span>
      <a href="#" class="text-muted" @click="view = 'deposit'">Deposit</a>
      <a href="#" class="text-muted" @click="view = 'withdraw'">
        {{ registeredAccount === account ? 'Withdraw' : 'Register' }}
      </a>
    </div>
    <transition name="fade" mode="out-in">
      <keep-alive>
        <DepositForm v-if="view == 'deposit'" />
        <WithdrawalForm v-else-if="view == 'withdraw'" />
        <SendForm v-else-if="view == 'send'" />
      </keep-alive>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  transition: 'fade',
  data() {
    return {
      view: 'send',
    }
  },
  computed: {
    ...mapGetters(['account', 'registeredAccount']),
    ...mapGetters('github', { githubUser: 'user' }),
  },
  watch: {
    githubUser() {
      if (this.githubUser) {
        this.$mergePay.methods._users(this.githubUser.login).call().then(result => {
          if (result.account !== "0x0000000000000000000000000000000000000000" && Number(result.confirmations)) {
            this.$store.commit('setRegisteredAccount', result.account)
          } else {
            this.$store.commit('setRegisteredAccount', null)
          }
        }).catch(() => {
          this.$store.commit('setRegisteredAccount', null)
        })
      } else {
        this.$store.commit('setRegisteredAccount', null)
      }
    }
  }
}
</script>
