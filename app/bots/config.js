require("dotenv").config();
const axios = require("axios")

const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const web3 = new Web3(process.env.ETH_NODE)
const octobay = new web3wallet.eth.Contract(require('./../OctoBay.json').abi, process.env.OCTOBAY_ADDRESS)

module.exports = { web3, octobay, axios, fs }
