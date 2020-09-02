export const state = () => ({
  accounts: [],
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
  }
}

export const mutations = {
  setAccounts(state, accounts) {
    state.accounts = accounts
  },
  setBalance(state, balance) {
    state.balance = balance
  }
}

export const actions = {
  load({ dispatch }) {
    return Promise.all([dispatch("github/login")])
  }
}
