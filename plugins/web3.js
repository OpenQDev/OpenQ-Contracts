const Web3 = require("web3")

export default ({ app }, inject) => {
  const web3 = typeof window.ethereum === 'undefined' ? null : new Web3(Web3.givenProvider || "ws://localhost:8545");
  const mergePay = web3 ? new web3.eth.Contract(process.env.MERGEPAY_ABI, process.env.MERGE_PAY_ADDRESS) : null
  inject('mergePay', mergePay)
  inject('web3', web3)
}
