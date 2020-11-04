<template>
  <div class="content card border-0 rounded-xl shadow">
    <div class="d-flex justify-content-around mt-3">
      <a href="#" :class="'mx-3 text-' + (view === 'send' ? 'primary' : 'muted')" @click="view = 'send'">Send</a>
      <a href="#" :class="'mx-3 text-' + (view === 'deposit' ? 'primary' : 'muted')" @click="view = 'deposit'">Deposit</a>
      <a href="#" :class="'mx-3 text-' + (view === 'issues' ? 'primary' : 'muted')" @click="view = 'issues'">Issues</a>
      <a href="#" :class="'mx-3 text-' + (view === 'withdraw' ? 'primary' : 'muted')" @click="view = 'withdraw'">
        {{ registeredAccount === account ? 'Withdraw' : 'Register' }}
      </a>
    </div>
    <transition name="fade" mode="out-in">
      <keep-alive>
        <SendForm v-if="view == 'send'" />
        <DepositForm v-else-if="view == 'deposit'" />
        <IssuesList v-else-if="view == 'issues'" />
        <WithdrawalForm v-else-if="view == 'withdraw'" />
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
          if (result.account !== "0x0000000000000000000000000000000000000000" && result.confirmed) {
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
