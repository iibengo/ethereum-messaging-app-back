const { ethers } = require("hardhat");
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

describe("MessageCounter", () => {
  let contractConnection: Contract;

  beforeEach(async () => {
    const MessageCounter: ContractFactory = await ethers.getContractFactory(
      "MessageCounter"
    );
    contractConnection = await MessageCounter.deploy();
    await contractConnection.deployed();
  });
  describe("increase", () => {
    it("should emit increased", async () => {
      await expect(contractConnection.increase()).to.emit(
        contractConnection,
        "Increased"
      );
    });
  });
});
