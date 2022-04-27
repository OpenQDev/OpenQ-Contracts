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
				// Needed for static code analysis tools to compile OpenZeppelin contracts pegged to 0.8.2
				{
					version: '0.8.2',
					settings: {
						optimizer: {
							enabled: true,
							runs: 1000,
						},
					},
				},
				{
					version: '0.8.12',
					settings: {
						optimizer: {
							enabled: true,
							runs: 1000,
						},
					},
				}
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
				gas: 9999999
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
			runOnCompile: true,
			strict: true
		}
	};

	return config;
})();
