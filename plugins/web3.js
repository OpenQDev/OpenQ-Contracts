let Web3 = require("web3")

export default ({ app }, inject) => {
  let web3 = typeof window.ethereum === 'undefined' ? false : new Web3(Web3.givenProvider || "ws://localhost:8545");
  inject('web3', web3)
}
