/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers, upgrades } = require("hardhat");

describe('OpenQV0Upgrade', () => {
	let openQ;
	let openQStorage;

	beforeEach(async () => {
		const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
		const OpenQStorage = await hre.ethers.getContractFactory('OpenQStorage');

		[owner] = await ethers.getSigners();

		openQ = await upgrades.deployProxy(OpenQ, []);
		await openQ.deployed();

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();
	});

	describe('constructor', () => {
		it('should initiatlize with implementation address', async () => {
			// ASSUME
			expect(await openQ.getImplementation()).equals("0x02df3a3F960393F5B349E40A599FEda91a7cc1A7");

			const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
			newOpenQ = await OpenQ.deploy();
			await newOpenQ.deployed();

			// ACT
			const newAddress = newOpenQ.address;
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQ.connect(notOwner);

			// ASSERT
			await expect(notOwnerContract.upgradeTo(newAddress)).to.be.revertedWith('Ownable: caller is not the owner');
		});
	});

	describe('upgradeTo', () => {
		it('should revert if not called by owner', async () => {
			// ASSUME
			expect(await openQ.getImplementation()).equals("0x02df3a3F960393F5B349E40A599FEda91a7cc1A7");

			const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
			newOpenQ = await OpenQ.deploy();
			await newOpenQ.deployed();

			// ACT
			const newAddress = newOpenQ.address;
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQ.connect(notOwner);

			// ASSERT
			await expect(notOwnerContract.upgradeTo(newAddress)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should update implementation address', async () => {
			// ASSUME
			expect(await openQ.getImplementation()).equals("0x02df3a3F960393F5B349E40A599FEda91a7cc1A7");

			const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
			newOpenQ = await OpenQ.deploy();
			await newOpenQ.deployed();

			// ACT
			const newAddress = newOpenQ.address;
			await openQ.upgradeTo(newAddress);

			// ASSERT
			expect(await openQ.getImplementation()).equals(newAddress);
		});
	});

	describe('setOpenQStorage', () => {
		it('should update the storage implementation address', async () => {
			// ASSUME
			expect(await openQ.openQStorage()).equals(ethers.constants.AddressZero);

			// ACT
			await openQ.setOpenQStorage(openQStorage.address);

			// ASSERT
			expect(await openQ.openQStorage()).equals(openQStorage.address);
		});
	});


});