require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-web3');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('solidity-docgen');
require('hardhat-tracer');
require('dotenv').config();
require('@typechain/hardhat');
require('solidity-coverage');

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
							runs: 100,
						},
					},
					paths: ['./contracts', './mocks']
				},
				{
					version: '0.8.17',
					settings: {
						optimizer: {
							enabled: true,
							runs: 100,
						},
					},
					paths: ['./contracts', './mocks']
				}
			],
		},
		networks: {
			localhost: {
				url: 'http://localhost:8545',
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
				gasPrice: 250000000000
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
