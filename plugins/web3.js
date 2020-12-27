const Web3 = require("web3")

export default ({ app }, inject) => {
  const web3 = typeof window.ethereum === 'undefined' ? null : new Web3(Web3.givenProvider || "ws://localhost:8545");
  const octoBay = web3 ? new web3.eth.Contract(process.env.OCTOBAY_ABI, process.env.OCTOBAY_ADDRESS) : null
  const linkToken = web3 ? new web3.eth.Contract(process.env.LINK_TOKEN_ABI, process.env.LINK_TOKEN_ADDRESS) : null

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', accounts => {
      app.store.dispatch('load')
    })

    window.ethereum.on('networkChanged', network => {
      app.store.dispatch('load')
    })
  }

  linkToken.methods.balanceOf(process.env.OCTOBAY_ADDRESS).call().then(balance => console.log(`OctoBay: ${web3.utils.fromWei(balance, 'ether')} LINK`))
  linkToken.methods.balanceOf(process.env.ORACLES[0].address).call().then(balance => console.log(`Oracle: ${web3.utils.fromWei(balance, 'ether')} LINK`))
  web3.eth.getBalance(process.env.CHAINLINK_NODE_ADDRESS).then(balance => console.log(`CL Node: ${web3.utils.fromWei(balance, 'ether')} ETH`))

  inject('octoBay', octoBay)
  inject('web3', web3)
}
