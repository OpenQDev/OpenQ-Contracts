export default {
  methods: {
    connect() {
      this.$web3.eth.requestAccounts().then(accounts => {
        this.$store.commit('setAccounts', accounts)
        this.$web3.eth.getBalance(accounts[0]).then(balance => this.$store.commit('setBalance', balance))
      }).catch(err => {
        console.log(err.message)
      })
    }
  }
}
