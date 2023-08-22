const { ethers } = require("hardhat");
import { expect } from "chai";
import { Contract, ContractFactory, Signer } from "ethers";

describe("PublicMessaging", () => {
  let owner: Signer, account2: Signer, account3: Signer, account4: Signer;
  let contractConnection: Contract;
  let user2Connection: Contract;
  let user3Connection: Contract;
  let notRegisterUserConnection: Contract;
  let accounts: Signer[];
  let user2Address: string;
  let ownerAddress: string;
  let notRegisteredAddress: String;

  // Antes de cada prueba, se despliega el contrato "PublicMessaging"
  beforeEach(async () => {
    const counterFactory = await ethers.getContractFactory("MessageCounter");
    const counterContract = await counterFactory.deploy();
    const PublicMessaging: ContractFactory = await ethers.getContractFactory(
      "PublicMessaging"
    );
    contractConnection = await PublicMessaging.deploy(counterContract.address);
    await contractConnection.deployed();
    await counterContract.changeOwner(contractConnection.address);
    accounts = await ethers.getSigners();
    owner = accounts[0];
    account2 = accounts[1];
    user2Connection = contractConnection.connect(accounts[1]);
    user3Connection = contractConnection.connect(accounts[2]);
    notRegisterUserConnection = contractConnection.connect(accounts[3]); // Usuario no registrado
    user2Address = await account2.getAddress();
    ownerAddress = await owner.getAddress();
    notRegisteredAddress = await accounts[3].getAddress();
    //Registrar usuarios
    await contractConnection.createUser("owner", {
      value: ethers.utils.parseEther("0.1"),
    });
    await user2Connection.createUser("user2", {
      value: ethers.utils.parseEther("0.1"),
    });
    await user3Connection.createUser("user3", {
      value: ethers.utils.parseEther("0.1"),
    });
  });
  describe("create user", () => {
    it("should trhow error if name empty", async () => {
      await expect(notRegisterUserConnection.createUser("")).to.be.rejectedWith(
        "Nickname must not be empty"
      );
    });
    it("should trhow error if name exists", async () => {
      await expect(user2Connection.createUser("user2")).to.be.rejectedWith(
        "User already exists"
      );
    });
    it("should trhow error if not value", async () => {
      await expect(
        notRegisterUserConnection.createUser("user4")
      ).to.be.rejectedWith("Insufficient value");
    });
  });
  describe("writeMessage and getAllMessages", () => {
    it("should write and read a message correctly", async function () {
      const content = "Hola, este es un mensaje de prueba";
      const content2 = "Mensaje 2!!!!";
      await expect(contractConnection.writeMessage(content)).to.emit(
        contractConnection,
        "MessageSent"
      );
      await contractConnection.writeMessage(content2);
      const response = await contractConnection.getAllMessages();
      expect(response.length).to.equal(2);
      expect(response[0].message.content).to.equal(content);
      expect(response[1].message.content).to.equal(content2);
    });
    it("should limit the length of a message to 300 characters", async function () {
      let content = "";
      for (var i = 0; i < 302; i++) {
        content += i.toString();
      }
      await expect(contractConnection.writeMessage(content)).to.be.rejectedWith(
        "The message exceeds 300 characters"
      );
    });
  });

  describe("get unread messages and update to read", () => {
    it("should return the correct count of unread messages", async function () {
      await contractConnection.writeMessage("Message 1");
      await contractConnection.writeMessage("Message 2");
      const unreadMessageCount =
        await contractConnection.getUserUnreadMessageCount();
      expect(unreadMessageCount).to.equal(2);
    });
    it("should return unread messages", async function () {
      const content = "Mensaje no leído";
      await contractConnection.writeMessage(content);
      const unreadMessages = await contractConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(1);
      expect(unreadMessages[0].message.content).to.equal(content);
      expect(unreadMessages[0].user.name).to.equal("owner");
    });
    it("should emmit unread messages", async function () {
      const content = "Mensaje no leído";
      await contractConnection.writeMessage(content);
      await expect(await contractConnection.updateUserMessageAsReadAndEmit())
        .to.emit(contractConnection, "UnreadUpdated")
        .withArgs((unreadList: any) => {
          const noReaded = unreadList[0].message[1];
          expect(noReaded).to.equal(content);
          expect(unreadList[0].user[1]).to.equal(ownerAddress);
          return unreadList;
        });
    });
    it("should mark messages as read and not return them", async function () {
      const content = "Mensaje no leído";
      await contractConnection.writeMessage(content);
      await contractConnection.updateUserMessageAsReadAndEmit();
      const unreadMessages = await contractConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);
    });
    it("should return messages for another account that has not readed", async function () {
      const content = "Mensaje no leído";
      await contractConnection.writeMessage(content);
      await contractConnection.writeMessage(content);
      await contractConnection.updateUserMessageAsReadAndEmit();
      let unreadMessages = await contractConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);

      // Usar cuenta2 para recuperar los no leidos y despues marcarlos como leidos
      await contractConnection.writeMessage(content);
      const mensajes = await user2Connection.getUserUnreadMessages();
      expect(mensajes.length).to.equal(3);
      await user2Connection.updateUserMessageAsReadAndEmit();
      unreadMessages = await user2Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);

      //Usar cuenta3 para recuperar los mensajes no leidos
      unreadMessages = await user3Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(3);
    });
  });
  describe("deleteMessage", () => {
    it("should delete message by owner", async () => {
      await contractConnection.writeMessage("content");
      await user2Connection.writeMessage("content");
      await contractConnection.deleteMessage(0);
      const unreadMessages = await contractConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(1);
    });
    it("should delete message by user", async () => {
      await user2Connection.writeMessage("content");
      await user2Connection.writeMessage("content");
      await user2Connection.deleteMessage(0);
      const unreadMessages = await user2Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(1);
    });
    it("Owner can delete user messages ", async () => {
      await user2Connection.writeMessage("content");
      await contractConnection.deleteMessage(0);
      const unreadMessages = await user2Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);
    });
    it("user can not delete owner messages ", async () => {
      await contractConnection.writeMessage("content");
      await expect(user2Connection.deleteMessage(0)).to.be.rejectedWith(
        "Sender is not authorized"
      );
    });
    it("is message not exist error", async () => {
      await contractConnection.writeMessage("content");
      await expect(user2Connection.deleteMessage(1)).to.be.rejectedWith(
        "Message not found."
      );
    });
    it("if message is deleted throw error", async () => {
      await user2Connection.writeMessage("content");
      await contractConnection.deleteMessage(0);
      await expect(user2Connection.deleteMessage(0)).to.be.rejectedWith(
        "Message is deleted"
      );
    });
  });
  describe("withdrawBalance", () => {
    it("should emit event with recipient param", async () => {
      await expect(await contractConnection.withdrawBalance()).to.emit(
        contractConnection,
        "BalanceWithdrawn"
      );
    });
    it("should throw error if balance = 0", async () => {
      await contractConnection.withdrawBalance();
      await expect(contractConnection.withdrawBalance()).to.be.rejectedWith(
        "No balance available to withdraw"
      );
    });
  });
  describe("disableUser", () => {
    it("should disable user2", async () => {
      await contractConnection.writeMessage("content");
      let msg = await user2Connection.getUserUnreadMessages();
      expect(msg.length).to.equal(1);
      await contractConnection.disableUser(user2Address);
      await expect(
        user2Connection.getUserUnreadMessageCount()
      ).to.be.rejectedWith("User inactive");
    });
    it("should throw error if user not exist", async () => {
      await expect(
        contractConnection.disableUser(notRegisteredAddress)
      ).to.be.rejectedWith("User not found.");
    });
  });
  describe("setFee", () => {
    it("should update fee", async () => {
      const newFee = ethers.utils.parseEther("0.1");
      await contractConnection.setFee(newFee);
      expect(await contractConnection.fee()).to.be.equal(newFee);
    });
  });
  describe("getUser", () => {
    it("should get user name", async () => {
      let user = await user2Connection.getUser(user2Address);
      expect(user.name).to.equal("user2");
    });
    it("should trow error if not exists user", async () => {
      await expect(
        user2Connection.getUser(notRegisteredAddress)
      ).to.be.rejectedWith("User Not Exist");
    });
  });
  describe("getTotalMessages", () => {
    it("should increase when new message created", async () => {
      await contractConnection.writeMessage("content");
      expect(await contractConnection.getTotalMessages()).to.equal(1);
    });
  });
  describe("updateUserName", () => {
    it("should change user name", async () => {
      await user2Connection.updateUserName("user2-new", {
        value: ethers.utils.parseEther("0.001"),
      });
      let user = await user2Connection.getUser(user2Address);
      expect(user.name).to.equal("user2-new");
    });
    it("should throw error if not value to change user name", async () => {
      await expect(
        user2Connection.updateUserName("new name")
      ).to.be.rejectedWith("Insufficient value");
    });
  });
  describe("modifiers", () => {
    describe("onlyActiveUser", () => {
      it("writeMessage should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.writeMessage("content")
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("getUserUnreadMessageCount should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.getUserUnreadMessageCount()
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("getUserUnreadMessages should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.getUserUnreadMessages()
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("deleteMessage should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.deleteMessage(0)
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("updateUserMessageAsReadAndEmit should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.deleteMessage(0)
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("updateUserName should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.updateUserName("new name")
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("updateUserMessageAsReadAndEmit should throw onlyActiveUser error", async () => {
        await expect(
          notRegisterUserConnection.updateUserMessageAsReadAndEmit()
        ).to.be.rejectedWith("Sender is not authorized");
      });
    });
    describe("onlyOwner", () => {
      it("withdrawBalance should throw onlyOwner error", async () => {
        await expect(user2Connection.withdrawBalance()).to.be.rejectedWith(
          "Sender is not authorized"
        );
      });
      it("setFee should throw onlyOwner error", async () => {
        await expect(
          user2Connection.setFee("100000000000000000")
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("disableUser should throw onlyOwner error", async () => {
        await expect(
          user2Connection.disableUser(user2Address)
        ).to.be.rejectedWith("Sender is not authorized");
      });
    });
  });
});
