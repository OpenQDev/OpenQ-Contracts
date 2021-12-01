require('@nomiclabs/hardhat-waffle');
require('dotenv').config();
require("hardhat-tracer");

module.exports = (function () {
	let chainId = process.env.CHAIN_ID;
	const chainIdInt = parseInt(chainId);

	const config = {
		solidity: '0.8.4',
		networks: {
			localhost: {
				url: process.env.PROVIDER_URL,
			},
			docker: {
				url: process.env.PROVIDER_URL,
				chainId: chainIdInt
			},
			mumbai: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.WALLET_KEY],
				chainId: chainIdInt,
				gas: 3000000
			},
			polygon: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.WALLET_KEY],
				chainId: chainIdInt
			},
			kovan: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.WALLET_KEY],
			},
		},
	};

	return config;
})();
