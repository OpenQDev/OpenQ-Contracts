/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers, upgrades } = require("hardhat");

describe('OpenQV0Proxy', () => {
	let openQImplementation;
	let openQProxy;
	let openQStorage;
	let oracle;

	let OpenQImplementation;
	let OpenQTokenWhitelist;

	beforeEach(async () => {
		OpenQImplementation = await hre.ethers.getContractFactory('OpenQV0');
		OpenQTokenWhitelist = await hre.ethers.getContractFactory('OpenQTokenWhitelist');
		const OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		const OpenQStorage = await hre.ethers.getContractFactory('OpenQStorage');

		[owner, , oracle] = await ethers.getSigners();

		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV0 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		await openQProxy.initialize(oracle.address);

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();
	});

	describe('constructor', () => {
		it('should initiatlize with implementation address', async () => {
			// ASSUME
			expect(await openQProxy.getImplementation()).equals(openQImplementation.address);
		});
	});

	describe('upgradeTo', () => {
		it('should revert if not called by owner', async () => {
			// ASSUME
			expect(await openQProxy.getImplementation()).equals(openQImplementation.address);

			// ARRANGE
			newOpenQ = await OpenQImplementation.deploy();
			await newOpenQ.deployed();
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.upgradeTo(newOpenQ.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should update implementation address', async () => {
			// ASSUME
			expect(await openQProxy.getImplementation()).equals(openQImplementation.address);

			const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
			newOpenQ = await OpenQ.deploy();
			await newOpenQ.deployed();

			// ACT
			const newAddress = newOpenQ.address;
			await openQProxy.upgradeTo(newAddress);

			// ASSERT
			expect(await openQProxy.getImplementation()).equals(newAddress);
		});
	});

	describe('setOpenQStorage', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.setOpenQStorage(openQStorage.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should update the storage implementation address', async () => {
			// ASSUME
			expect(await openQProxy.openQStorage()).equals(ethers.constants.AddressZero);

			// ACT
			await openQProxy.setOpenQStorage(openQStorage.address);

			// ASSERT
			expect(await openQProxy.openQStorage()).equals(openQStorage.address);
		});
	});

	describe('transferOracle', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.transferOracle(openQStorage.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should transfer oracle address', async () => {
			// ASSUME
			expect(await openQProxy.oracle()).equals(oracle.address);

			// ACT
			[, otherOracle] = await ethers.getSigners();
			await openQProxy.transferOracle(otherOracle.address);

			// ASSERT
			expect(await openQProxy.oracle()).equals(otherOracle.address);
		});
	});

	describe('setOpenQTokenWhitelist', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.setTokenWhitelist(openQStorage.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called by proxy', async () => {
			// ACT / ASSERT
			await expect(openQImplementation.setTokenWhitelist(openQStorage.address)).to.be.revertedWith('Function must be called through delegatecall');
		});

		it('should set OpenQTokenWhitelist', async () => {
			// ASSUME
			expect(await openQProxy.openQTokenWhitelist()).equals(ethers.constants.AddressZero);

			// ARRANGE
			const openQTokenWhitelist = await OpenQTokenWhitelist.deploy(20);
			await openQTokenWhitelist.deployed();

			// ACT
			await openQProxy.setTokenWhitelist(openQTokenWhitelist.address);

			// ASSERT
			expect(await openQProxy.openQTokenWhitelist()).equals(openQTokenWhitelist.address);
		});
	});
});