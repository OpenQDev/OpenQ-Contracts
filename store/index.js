export const state = () => ({
  networkId: null,
  accounts: [],
  registeredAccount: null,
  balance: 0,
  octoBalance: 0,
  issues: []
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
  },
  issues(state) {
    return state.issues
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
  },
  addIssue(state, issue) {
    state.issues.push(issue)
  },
  removeIssue(state, issueId) {
    let existingIssueIndex = state.issues.findIndex(i => i.id === issueId)
    if (existingIssueIndex != -1) {
      state.issues.splice(existingIssueIndex, 1)
    }
  },
  addDeposit(state, { issue, deposit }) {
    let existingIssue = state.issues.find(i => i.id === issue.id)
    if (existingIssue) {
      existingIssue.depositAmount += Number(this.$web3.utils.fromWei(deposit.amount, 'ether'))
      existingIssue.deposits.push(deposit)
    }
  },
  removeDeposit(state, { issueId, depositId }) {
    let existingIssueIndex = state.issues.findIndex(issue => issue.id === issueId)
    if (existingIssueIndex != -1) {
      let existingDepositIndex = state.issues[existingIssueIndex].deposits.findIndex(deposit => deposit.id === depositId)
      if (existingDepositIndex != -1) {
        state.issues[existingIssueIndex].deposits.splice(existingDepositIndex, 1)
        if (!state.issues[existingIssueIndex].deposits.length) {
          state.issues.splice(existingIssueIndex, 1)
        }
      }
    }
  },
  updatePins(state, { issueId, pins }) {
    let existingIssue = state.issues.find(issue => issue.id === issueId)
    if (existingIssue) {
      existingIssue.boostAmount = Number(this.$web3.utils.fromWei(pins, 'ether'))
    }
  }
}

export const actions = {
  load({ commit, dispatch, state, rootState }) {
    return dispatch("github/login").then((result) => {
      if (rootState.github.user && this.$octoBay) {
        this.$octoBay.methods._users(rootState.github.user.login).call().then(result => {
          commit("setRegisteredAccount", result.account !== "0x0000000000000000000000000000000000000000" && result.confirmed ? result.account : null)
        }).catch(() => {
          commit("setRegisteredAccount", null)
        })
      }
      if (this.$web3 && this.$octoBay) {
        this.$web3.eth.getAccounts().then(accounts => {
          if (accounts.length) {
            commit('setAccounts', accounts)
            this.$web3.eth.getBalance(accounts[0]).then(balance => commit('setBalance', balance))
            this.$octoBay.methods.balanceOf(accounts[0]).call().then(balance => commit('setOctoBalance', balance))
          }
        })
        this.$web3.eth.net.getId().then(result => {
          commit('setNetworkId', result)
        })
      }
    })
  },
  updateIssues({ state, commit }) {
    if (this.$octoBay) {
      this.$octoBay.methods._nextIssueDepositId().call().then(async maxId => {
        maxId = Number(maxId)
        if (maxId) {
          let id = maxId
          while (id) {
            const deposit = await this.$octoBay.methods._issueDeposits(id).call()
            deposit.id = id
            if (deposit.amount > 0) {
              let existingIssue = state.issues.find(issue => issue.id == deposit.issueId)
              if (existingIssue) {
                let depositExists = existingIssue.deposits.findIndex(d => d.id == id)
                if (depositExists === -1) {
                  commit('addDeposit', { issue: existingIssue, deposit })
                }
              } else {
                const newIssue = {
                  id: deposit.issueId,
                  deposits: [deposit],
                  depositAmount: Number(this.$web3.utils.fromWei(deposit.amount, 'ether')),
                  boostAmount: 0
                }
                const boostAmount = await this.$octoBay.methods._issueBoosts(newIssue.id).call()
                newIssue.boostAmount = Number(this.$web3.utils.fromWei(boostAmount, 'ether'))
                commit('addIssue', newIssue)
              }
            }
            id--
          }
        }
      })
    }
  },
  async updatePins({ commit }, issueId) {
    const pins = await this.$octoBay.methods._issueBoosts(issueId).call()
    commit('updatePins', { issueId, pins })
  }
}
