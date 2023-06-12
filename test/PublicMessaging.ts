const { ethers } = require("hardhat");
import { expect } from "chai";
import { Contract, ContractFactory, Signer } from "ethers";

describe("PublicMessaging", () => {
  let owner: Signer, account2: Signer, account3: Signer, account4: Signer;
  let ownerConnection: Contract;
  let user2Connection: Contract;
  let user3Connection: Contract;
  let notRegisterUserConnection: Contract;
  let accounts: Signer[];
  let user2Address: string;
  // Antes de cada prueba, se despliega el contrato "PublicMessaging"
  beforeEach(async () => {
    const PublicMessaging: ContractFactory = await ethers.getContractFactory(
      "PublicMessaging"
    );
    ownerConnection = await PublicMessaging.deploy();
    await ownerConnection.deployed();
    accounts = await ethers.getSigners();
    owner = accounts[0];
    account2 = accounts[1];
    user2Connection = ownerConnection.connect(accounts[1]);
    user3Connection = ownerConnection.connect(accounts[2]);
    notRegisterUserConnection = ownerConnection.connect(accounts[3]); // Usuario no registrado
    user2Address = await account2.getAddress();
    //Registrar usuarios
    await ownerConnection.createUser("owner", {
      value: ethers.utils.parseEther("0.1"),
    });
    await user2Connection.createUser("user2", {
      value: ethers.utils.parseEther("0.1"),
    });
    await user3Connection.createUser("user3", {
      value: ethers.utils.parseEther("0.1"),
    });
  });
  describe("writeMessage and getAllMessages", () => {
    it("should write and read a message correctly", async function () {
      const content = "Hola, este es un mensaje de prueba";
      const content2 = "Mensaje 2!!!!";
      await expect(ownerConnection.writeMessage(content)).to.emit(
        ownerConnection,
        "MessageSent"
      );
      await ownerConnection.writeMessage(content2);
      const response = await ownerConnection.getAllMessages();
      expect(response.length).to.equal(2);
      expect(response[0].message.content).to.equal(content);
      expect(response[1].message.content).to.equal(content2);
    });
    it("should limit the length of a message to 300 characters", async function () {
      let content = "";
      for (var i = 0; i < 302; i++) {
        content += i.toString();
      }
      await expect(ownerConnection.writeMessage(content)).to.be.rejectedWith(
        "The message exceeds 300 characters"
      );
    });
  });

  describe("markMessagesAsRead and getUserUnreadMessages", () => {
    it("should return the correct count of unread messages", async function () {
      await ownerConnection.writeMessage("Message 1");
      await ownerConnection.writeMessage("Message 2");
      const unreadMessageCount =
        await ownerConnection.getUserUnreadMessageCount();
      expect(unreadMessageCount).to.equal(2);
    });
    it("should return unread messages", async function () {
      const content = "Mensaje no leído";
      await ownerConnection.writeMessage(content);
      const unreadMessages = await ownerConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(1);
      expect(unreadMessages[0].message.content).to.equal(content);
      expect(unreadMessages[0].user.name).to.equal("owner");
    });
    it("should mark messages as read and not return them", async function () {
      const content = "Mensaje no leído";
      await ownerConnection.writeMessage(content);
      await ownerConnection.markUserMessagesAsRead();
      const unreadMessages = await ownerConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);
    });
    it("should return messages for another account that has not readed", async function () {
      const content = "Mensaje no leído";
      await ownerConnection.writeMessage(content);
      await ownerConnection.writeMessage(content);
      await ownerConnection.markUserMessagesAsRead();
      let unreadMessages = await ownerConnection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);

      // Usar cuenta2 para recuperar los no leidos y despues marcarlos como leidos
      await ownerConnection.writeMessage(content);
      const mensajes = await user2Connection.getUserUnreadMessages();
      expect(mensajes.length).to.equal(3);
      await user2Connection.markUserMessagesAsRead();
      unreadMessages = await user2Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);

      //Usar cuenta3 para recuperar los mensajes no leidos
      unreadMessages = await user3Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(3);
    });
  });
  describe("deleteMessage", () => {
    it("should delete message by owner", async () => {
      await ownerConnection.writeMessage("content");
      await user2Connection.writeMessage("content");
      await ownerConnection.deleteMessage(0);
      const unreadMessages = await ownerConnection.getUserUnreadMessages();
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
      await ownerConnection.deleteMessage(0);
      const unreadMessages = await user2Connection.getUserUnreadMessages();
      expect(unreadMessages.length).to.equal(0);
    });
    it("user can not delete owner messages ", async () => {
      await ownerConnection.writeMessage("content");
      await expect(user2Connection.deleteMessage(0)).to.be.rejectedWith(
        "Sender is not authorized"
      );
    });
    it("is message not exist error", async () => {
      await ownerConnection.writeMessage("content");
      await expect(user2Connection.deleteMessage(1)).to.be.rejectedWith(
        "Message not found."
      );
    });
  });
  describe("withdrawBalance", () => {
    it("should emit event with recipient param", async () => {
      await expect(await ownerConnection.withdrawBalance()).to.emit(
        ownerConnection,
        "BalanceWithdrawn"
      );
    });
  });
  describe("disableUser", () => {
    it("should disable user2", async () => {
      await ownerConnection.writeMessage("content");
      let msg = await user2Connection.getUserUnreadMessages();
      expect(msg.length).to.equal(1);
      await ownerConnection.disableUser(user2Address);
      await expect(
        user2Connection.getUserUnreadMessageCount()
      ).to.be.rejectedWith("User inactive");
    });
  });
  describe("setFee", () => {
    it("should update fee", async () => {
      const newFee = ethers.utils.parseEther("0.1");
      await ownerConnection.setFee(newFee);
      expect(await ownerConnection.fee()).to.be.equal(newFee);
    });
  });
  describe("updateUserName", () => {
    it("should change user name", async () => {
      let user = await user2Connection.getUser(user2Address);
      expect(user.name).to.equal("user2");
      await user2Connection.updateUserName("user2-new", {
        value: ethers.utils.parseEther("0.001"),
      });
      user = await user2Connection.getUser(user2Address);
      expect(user.name).to.equal("user2-new");
    });
  });
  describe("modifiers", () => {
    describe("onlyUser", () => {
      it("writeMessage should throw onlyUser error", async () => {
        await expect(
          notRegisterUserConnection.writeMessage("content")
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("getUserUnreadMessageCount should throw onlyUser error", async () => {
        await expect(
          notRegisterUserConnection.getUserUnreadMessageCount()
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("getUserUnreadMessages should throw onlyUser error", async () => {
        await expect(
          notRegisterUserConnection.getUserUnreadMessages()
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("markUserMessagesAsRead should throw onlyUser error", async () => {
        await expect(
          notRegisterUserConnection.markUserMessagesAsRead()
        ).to.be.rejectedWith("Sender is not authorized");
      });
      it("deleteMessage should throw onlyUser error", async () => {
        await expect(
          notRegisterUserConnection.deleteMessage(0)
        ).to.be.rejectedWith("Sender is not authorized");
      });
    });
    describe("onlyOwner", () => {
      it("withdrawBalance should throw onlyOwner error", async () => {
        await expect(user2Connection.withdrawBalance()).to.be.rejectedWith(
          "Sender is not authorized"
        );
      });
    });
  });
});
