require("dotenv").config();
const axios = require("axios")

const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".mnemonic").toString().trim();
// const node = `wss://kovan.infura.io/ws/v3/${process.env.INFURA_KEY}`
const node = 'ws://localhost:9545'
const web3 = new Web3(node)
const walletProvider = new HDWalletProvider(mnemonic, node)
const web3wallet = new Web3(walletProvider)
const mergepay = new web3wallet.eth.Contract(require('./../MergePay.json').abi, process.env.MERGEPAY_ADDRESS)

module.exports = { web3, web3wallet, mergepay, axios }
