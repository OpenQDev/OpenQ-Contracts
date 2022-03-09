require('@nomiclabs/hardhat-waffle');
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();
require('hardhat-tracer');

module.exports = (function () {
	let chainId = process.env.CHAIN_ID;
	const chainIdInt = parseInt(chainId);

	const config = {
		solidity: '0.8.12',
		networks: {
			localhost: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.CLIENT, process.env.CONTRIBUTOR]
			},
			docker: {
				url: process.env.PROVIDER_URL,
				chainId: chainIdInt
			},
			mumbai: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.CLIENT, process.env.CONTRIBUTOR],
				chainId: chainIdInt,
				gas: 9999999
			},
			polygon: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.CLIENT, process.env.CONTRIBUTOR],
				chainId: chainIdInt,
				gas: 9999999
			},
		},
		etherscan: {
			apiKey: process.env.POLYGON_SCAN_API_KEY
		}
	};

	return config;
})();
