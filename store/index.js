export const state = () => ({
  accounts: [],
  registered: false,
  balance: 0
})

export const getters = {
  accounts(state) {
    return state.accounts
  },
  account(state) {
    return state.accounts.length ? state.accounts[0] : null
  },
  balance(state) {
    return state.balance
  },
  connected(state) {
    return !!state.accounts.length
  },
  registered(state) {
    return state.registered
  }
}

export const mutations = {
  setAccounts(state, accounts) {
    state.accounts = accounts
  },
  setBalance(state, balance) {
    state.balance = balance
  },
  setRegistered(state, registered) {
    state.registered = registered
  }
}

export const actions = {
  load({ commit, dispatch, state, rootState }) {
    return dispatch("github/login").then((result) => {
      if (rootState.github.user) {
        this.$mergePay.methods._users(rootState.github.user.login).call().then(result => {
          commit("setRegistered", result.account !== "0x0000000000000000000000000000000000000000" && result.confirmations)
        }).catch(() => {
          commit("setRegistered", false)
        })
      }
    })
  },
}
