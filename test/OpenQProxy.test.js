/* eslint-disable */
const { BigNumber } = require('@ethersproject/bignumber');
const { expect } = require('chai');
require('@nomiclabs/hardhat-waffle');
const truffleAssert = require('truffle-assertions');
const { ethers } = require("hardhat");

describe('OpenQProxy', () => {
	let openQImplementation;
	let openQProxy;

	let owner;
	let notOwner;
	let randomContractUpgradeAddress;

	let OpenQImplementation;
	let OpenQTokenWhitelist;
	let OpenQProxy;
	let BountyFactory;

	beforeEach(async () => {
		OpenQImplementation = await hre.ethers.getContractFactory('OpenQV0');
		OpenQTokenWhitelist = await hre.ethers.getContractFactory('OpenQTokenWhitelist');
		OpenQProxy = await hre.ethers.getContractFactory('OpenQProxy');
		BountyFactory = await hre.ethers.getContractFactory('BountyFactory');

		[owner, notOwner, oracle] = await ethers.getSigners();

		// Deploy OpenQV0 Implementation
		openQImplementation = await OpenQImplementation.deploy();
		await openQImplementation.deployed();

		randomContractUpgradeAddress = await OpenQImplementation.deploy();
		await randomContractUpgradeAddress.deployed();

		// Deploy OpenQProxy with the previously deployed OpenQV0 implementation's address
		openQProxy = await OpenQProxy.deploy(openQImplementation.address, []);
		await openQProxy.deployed();

		// Attach the OpenQV0 ABI to the OpenQProxy address to send method calls to the delegatecall
		openQProxy = await OpenQImplementation.attach(openQProxy.address);

		// Initialize the OpenQProxy
		await openQProxy.initialize(oracle.address);
	});

	describe('constructor', () => {
		it('should initiatlize with implementation address', async () => {
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

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await expect(openQImplementation.upgradeTo(randomContractUpgradeAddress.address)).to.be.revertedWith('Function must be called through delegatecall');
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

		// See _upgradeToAndCallUUPS method at @openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol:98 for details
		it('should prevent upgrades to non-UUPS compliant addresses', async () => {
			// ASSUME
			expect(await openQProxy.getImplementation()).equals(openQImplementation.address);

			// ACT / ASSERT
			await expect(openQProxy.upgradeTo(notOwner.address)).to.be.reverted;
		});
	});

	describe('transferOracle', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.transferOracle(randomContractUpgradeAddress.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await expect(openQImplementation.transferOracle(randomContractUpgradeAddress.address)).to.be.revertedWith('Function must be called through delegatecall');
		});

		it('should transfer oracle address', async () => {
			// ASSUME
			expect(await openQProxy.oracle()).equals(oracle.address);

			// ACT
			await openQProxy.transferOracle(notOwner.address);

			// ASSERT
			expect(await openQProxy.oracle()).equals(notOwner.address);
		});
	});

	describe('setBountyFactory', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.setBountyFactory(randomContractUpgradeAddress.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await expect(openQImplementation.setBountyFactory(randomContractUpgradeAddress.address)).to.be.revertedWith('Function must be called through delegatecall');
		});

		it('should set new bounty factory address', async () => {
			// ASSUME
			expect(await openQProxy.bountyFactory()).equals(ethers.constants.AddressZero);

			// ACT
			await openQProxy.setBountyFactory(notOwner.address);

			// ASSERT
			expect(await openQProxy.bountyFactory()).equals(notOwner.address);
		});
	});

	describe('setOpenQTokenWhitelist', () => {
		it('should revert if not called by owner', async () => {
			// ARRANGE
			[, notOwner] = await ethers.getSigners();
			let notOwnerContract = openQProxy.connect(notOwner);

			// ACT / ASSERT
			await expect(notOwnerContract.setTokenWhitelist(randomContractUpgradeAddress.address)).to.be.revertedWith('Ownable: caller is not the owner');
		});

		it('should revert if not called via delegatecall', async () => {
			// ACT / ASSERT
			await expect(openQImplementation.setTokenWhitelist(randomContractUpgradeAddress.address)).to.be.revertedWith('Function must be called through delegatecall');
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