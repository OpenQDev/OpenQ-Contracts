require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-web3');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('solidity-docgen');
require('hardhat-tracer');
require('dotenv').config();
require('@typechain/hardhat');

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
							runs: 200,
						},
					},
				},
				{
					version: '0.8.16',
					settings: {
						optimizer: {
							enabled: true,
							runs: 200,
						},
					},
				}
			],
		},
		networks: {
			localhost: {
				url: 'http://ethnode:8545',
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
		},
		gasReporter: {
			enabled: false,
			currency: 'USD',
			gasPrice: 21,
			token: 'ETH',
			gasPriceApi: 'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice'
		},
		docgen: {
			outputDir: '../OpenQ-Documentation',
			pages: 'files'
		},

		typechain: {
			outDir: './generated/typechain',
		},
	};

	return config;
})();
