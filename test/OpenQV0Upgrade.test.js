/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers, upgrades } = require("hardhat");

describe.only('OpenQV0Upgrade', () => {
	let openQ;
	let openQStorage;
	let oracle;

	beforeEach(async () => {
		const OpenQ = await hre.ethers.getContractFactory('OpenQV0');
		const OpenQStorage = await hre.ethers.getContractFactory('OpenQStorage');

		[owner, , oracle] = await ethers.getSigners();

		openQ = await upgrades.deployProxy(OpenQ, [oracle.address], { kind: 'uups' });
		await openQ.deployed();

		openQStorage = await OpenQStorage.deploy();
		await openQStorage.deployed();
	});

	describe('constructor', () => {
		it('should initiatlize with implementation address', async () => {
			// ASSUME
			expect(await openQ.getImplementation()).equals("0xB2b580ce436E6F77A5713D80887e14788Ef49c9A");

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
			expect(await openQ.getImplementation()).equals("0x5FbDB2315678afecb367f032d93F642f64180aa3");

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
			expect(await openQ.getImplementation()).equals("0x5FbDB2315678afecb367f032d93F642f64180aa3");

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

	describe('set oracle', () => {
		it('should set the oracle address', async () => {
			// ASSERT
			const oracleAddress = await openQ.oracle();
			expect(oracleAddress).equals(oracle.address);
		});
	});
});