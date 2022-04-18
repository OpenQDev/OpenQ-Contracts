require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-contract-sizer');
require('hardhat-tracer');
require('dotenv').config();

module.exports = (function () {
	let chainId = process.env.CHAIN_ID;
	const chainIdInt = parseInt(chainId);

	const config = {
		solidity: {
			compilers: [
				{ version: '0.8.2' },
				{ version: '0.8.12' }
			],
		},
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
				gas: 9999999,
				gasPrice: 100000000000
			},
			polygon: {
				url: process.env.PROVIDER_URL,
				accounts: [process.env.CLIENT, process.env.CONTRIBUTOR],
				chainId: chainIdInt,
				gas: 9999999,
				gasPrice: 100000000000
			},
		},
		etherscan: {
			apiKey: process.env.POLYGON_SCAN_API_KEY
		},
		contractSizer: {
			alphaSort: true,
			disambiguatePaths: false,
			runOnCompile: false,
			strict: true
		}
	};

	return config;
})();
