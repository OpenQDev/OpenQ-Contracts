const Web3 = require("web3")

export default ({ app }, inject) => {
  const web3 = typeof window.ethereum === 'undefined' ? null : new Web3(Web3.givenProvider || "ws://localhost:8545");
  const octoBay = web3 ? new web3.eth.Contract(process.env.OCTOBAY_ABI, process.env.OCTOBAY_ADDRESS) : null

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', accounts => {
      app.store.dispatch('load')
    })

    window.ethereum.on('networkChanged', network => {
      app.store.dispatch('load')
    })
  }

  inject('octoBay', octoBay)
  inject('web3', web3)
}
