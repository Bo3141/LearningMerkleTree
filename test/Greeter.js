const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", () => {
    it("Should return the new greeting once it's changed", async () => {
        const Greeter = await ethers.getContractFactory("Greeter");
        const greeting = "Hello, world!";
        const greeter = await Greeter.deploy(greeting);
        await greeter.deployed();

        expect(await greeter.greet()).to.equal(greeting);

        const newGreeting = "Hola, mundo!";
        const setGreetingTx = await greeter.setGreeting(newGreeting);
        await setGreetingTx.wait(); // Waiting for the transaction to be mined

        expect(await greeter.greet()).to.equal(newGreeting);
    });
});
