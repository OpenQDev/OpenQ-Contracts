/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');

describe.only('OpenQProxy.sol', () => {
	let openQ;
	let openQStorage;
	let openQProxy;

	beforeEach(async () => {
		const OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		const OpenQStorage = await hre.ethers.getContractFactory('OpenQStorage');
		const OpenQ = await hre.ethers.getContractFactory('OpenQV0');

		[owner] = await ethers.getSigners();

		openQ = await OpenQ.deploy();
		await openQ.deployed();

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();

		openQProxy = await OpenQProxy.deploy(openQ.address, []);
		await openQProxy.deployed();
	});

	describe('constructor', () => {
		it('should initiatlize with implementation address', async () => {
			// ARRANGE
			const OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
			openQProxy = await OpenQProxy.deploy(openQ.address, []);
			await openQProxy.deployed();

			// ASSERT
			expect(await openQProxy.getVersion()).equals(openQ.address);
		});
	});

	describe('upgradeTo', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			const [, notOwner] = await ethers.getSigners();
			let issueWithNonOwnerAccount = openQProxy.connect(notOwner);

			// ASSERT
			await expect(issueWithNonOwnerAccount.upgradeTo(openQ.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should update implementation address', async () => {
			// ASSUME
			expect(await openQProxy.getVersion()).equals(openQ.address);

			// ACT
			const newAddress = openQStorage.address;
			await openQProxy.upgradeTo(newAddress);

			// ASSERT
			expect(await openQProxy.getVersion()).equals(newAddress);
		});
	});

	describe('setOpenQStorage', () => {
		it('should update the storage implementation address', async () => {
			// ASSUME
			expect(await openQProxy.openQStorage()).equals(hre.ethers.constants.AddressZero);

			// ACT
			await openQProxy.setOpenQStorage(openQStorage.address);

			// ASSERT
			expect(await openQProxy.openQStorage()).equals(openQStorage.address);
		});
	});


});