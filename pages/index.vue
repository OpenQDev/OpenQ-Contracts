<template>
  <div class="content card overflow-hidden border-0 rounded-xl shadow-sm">
    <div class="d-flex justify-content-around mt-4 px-2">
      <a href="#" :class="'mx-2 text-' + (view === 'send' ? 'primary' : 'muted')" @click="view = 'send'">Send</a>
      <a href="#" :class="'mx-2 text-' + (view === 'issues' ? 'primary' : 'muted')" @click="view = 'issues'">Pinboard</a>
      <a href="#" :class="'mx-2 text-' + (view === 'contributors' ? 'primary' : 'muted')" @click="view = 'contributors'">Contributors</a>
      <a href="#" :class="'mx-2 text-' + (view === 'claim' ? 'primary' : 'muted')" @click="view = 'claim'">
        {{ registeredAccount === account ? 'Claim' : 'Register' }}
      </a>
    </div>
    <transition name="fade" mode="out-in">
      <keep-alive>
        <SendForm v-if="view == 'send'" />
        <IssuesList v-else-if="view == 'issues'" />
        <Contributors v-else-if="view == 'contributors'" />
        <Claim v-else-if="view == 'claim'" />
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
      view: 'issues',
    }
  },
  computed: {
    ...mapGetters(['account', 'registeredAccount']),
    ...mapGetters('github', { githubUser: 'user' }),
  },
  watch: {
    githubUser() {
      if (this.githubUser) {
        this.$octoBay.methods.userIDsByGithubUser(this.githubUser.login).call().then(userId => {
          if (userId) {
            this.$octoBay.methods.users(userId).call().then(result => {
              if (result.ethAddress !== "0x0000000000000000000000000000000000000000" && result.status === '2') {
                this.$store.commit('setRegisteredAccount', result.ethAddress)
              } else {
                this.$store.commit('setRegisteredAccount', null)
              }
            }).catch(() => {
              this.$store.commit('setRegisteredAccount', null)
            })
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
