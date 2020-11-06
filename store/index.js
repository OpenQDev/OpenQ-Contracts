export const state = () => ({
  networkId: null,
  accounts: [],
  registeredAccount: null,
  balance: 0,
  octoBalance: 0
})

export const getters = {
  networkId(state) {
    return state.networkId
  },
  accounts(state) {
    return state.accounts
  },
  account(state) {
    return state.accounts.length ? state.accounts[0] : null
  },
  balance(state) {
    return state.balance
  },
  octoBalance(state) {
    return state.octoBalance
  },
  connected(state) {
    return !!state.accounts.length
  },
  registeredAccount(state) {
    return state.registeredAccount
  }
}

export const mutations = {
  setNetworkId(state, id) {
    state.networkId = id
  },
  setAccounts(state, accounts) {
    state.accounts = accounts
  },
  setBalance(state, balance) {
    state.balance = balance
  },
  setOctoBalance(state, balance) {
    state.octoBalance = balance
  },
  setRegisteredAccount(state, registeredAccount) {
    state.registeredAccount = registeredAccount
  }
}

export const actions = {
  load({ commit, dispatch, state, rootState }) {
    return dispatch("github/login").then((result) => {
      if (rootState.github.user && this.$mergePay) {
        this.$mergePay.methods._users(rootState.github.user.login).call().then(result => {
          commit("setRegisteredAccount", result.account !== "0x0000000000000000000000000000000000000000" && result.confirmed ? result.account : null)
        }).catch(() => {
          commit("setRegisteredAccount", null)
        })
      }
      if (this.$web3 && this.$mergePay) {
        this.$web3.eth.getAccounts().then(accounts => {
          if (accounts.length) {
            commit('setAccounts', accounts)
            this.$web3.eth.getBalance(accounts[0]).then(balance => commit('setBalance', balance))
            this.$mergePay.methods.balanceOf(accounts[0]).call().then(balance => commit('setOctoBalance', balance))
          }
        })
        this.$web3.eth.net.getId().then(result => {
          commit('setNetworkId', result)
        })
      }
    })
  },
}
