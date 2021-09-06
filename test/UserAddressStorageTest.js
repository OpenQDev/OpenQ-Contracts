const { expect } = require("chai");

describe("UserAddressStorage contract", () => {
    it("setOpenQ should set openq address", async () => {
        const UserAddressStorage = await ethers.getContractFactory("UserAddressStorage");
        const userAddressStorage = await UserAddressStorage.deploy();

        const address = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

        await userAddressStorage.setOpenQ(address);
        expect(await userAddressStorage.openq()).to.equal(address);
    });
});