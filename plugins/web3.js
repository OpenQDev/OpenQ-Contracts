const Web3 = require("web3")
const { RelayProvider } = require('@opengsn/gsn')

export default async ({ app }, inject) => {
  if (window.ethereum) {
    const plainWeb3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

    const gsnRelayProvider = await RelayProvider.newProvider({
      provider: plainWeb3.currentProvider,
      config: {
        paymasterAddress: process.env.GSN_PAYMASTER_ADDRESS,
        loggerConfiguration: {
          logLevel: 'debug',
          loggerUrl: 'https://logger.opengsn.org',
          applicationId: 'octobay-dev'
        }
      }
    }).init()

    const web3 = new Web3(gsnRelayProvider)
    const octoBay = new web3.eth.Contract(process.env.OCTOBAY_ABI, process.env.OCTOBAY_ADDRESS)
    const linkToken = new web3.eth.Contract(process.env.LINK_TOKEN_ABI, process.env.LINK_TOKEN_ADDRESS)

    window.ethereum.on('accountsChanged', accounts => {
      app.store.dispatch('load')
    })

    window.ethereum.on('networkChanged', network => {
      app.store.dispatch('load')
    })

    linkToken.methods.balanceOf(process.env.OCTOBAY_ADDRESS).call().then(balance => console.log(`OctoBay: ${web3.utils.fromWei(balance, 'ether')} LINK`))
    linkToken.methods.balanceOf(process.env.ORACLES[0].address).call().then(balance => console.log(`Oracle: ${web3.utils.fromWei(balance, 'ether')} LINK`))
    web3.eth.getBalance(process.env.CHAINLINK_NODE_ADDRESS).then(balance => console.log(`CL Node: ${web3.utils.fromWei(balance, 'ether')} ETH`))

    inject('octoBay', octoBay)
    inject('web3', web3)
  }
}
