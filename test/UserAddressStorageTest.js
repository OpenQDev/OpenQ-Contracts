const { expect } = require("chai");
require("@nomiclabs/hardhat-waffle");
const truffleAssert = require('truffle-assertions');

describe("UserAddressStorage contract", () => {
    // ACCESS CONTROLS
    it("setOpenQ should set openq address", async () => {
        const UserAddressStorage = await ethers.getContractFactory("UserAddressStorage");
        const userAddressStorage = await UserAddressStorage.deploy();

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

        await userAddressStorage.setOpenQ(address);
        expect(await userAddressStorage.openq()).to.equal(address);
    });

    it("can only be called from OpenQ contract", async () => {
        const UserAddressStorage = await ethers.getContractFactory("UserAddressStorage");
        const userAddressStorage = await UserAddressStorage.deploy();

        const accounts = await ethers.getSigners();
        const [owner] = await ethers.getSigners();
        await userAddressStorage.setOpenQ(owner.address);

        const stranger = accounts[1];
        let contractWithNonOwnerAccount = userAddressStorage.connect(stranger);

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
        const gitHubUsername = "alo9507";

        await expect(contractWithNonOwnerAccount.upsertUserAddress(gitHubUsername, address)).to.be.revertedWith('OpenQStorage: Only the current OpenQ version can use this function.');
    });

    // LOGIC
    it("upsertUserAddress associate GitHub username to Ethereum address", async () => {
        const UserAddressStorage = await ethers.getContractFactory("UserAddressStorage");
        const userAddressStorage = await UserAddressStorage.deploy();

        const [owner] = await ethers.getSigners();
        await userAddressStorage.setOpenQ(owner.address);

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
        const gitHubUsername = "alo9507";

        // insert new user
        await userAddressStorage.upsertUserAddress(gitHubUsername, address);
        expect(await userAddressStorage.addresses(gitHubUsername)).to.equal(address);
        expect(await userAddressStorage.userIdsByAddress(address)).to.equal(gitHubUsername);

        // update existing user
        const newAddress = "0x947F3FC93AB8b74C44F837d3031347DDBb32cf08";

        await userAddressStorage.upsertUserAddress(gitHubUsername, newAddress);
        expect(await userAddressStorage.addresses(gitHubUsername)).to.equal(newAddress);
        expect(await userAddressStorage.userIdsByAddress(newAddress)).to.equal(gitHubUsername);
    });
});