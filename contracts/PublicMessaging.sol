// SPDX-License-Identifier: MIT
// Author: Ion Iñaki Bengoechea
import "../node_modules/hardhat/console.sol";
pragma solidity ^0.8.0;

struct UserModel {
    string name;
    address wallet;
    bool active;
    uint256 created;
}
struct MessageModel {
    uint256 id;
    string content;
    address sender;
    bool isDeleted;
    uint256 created;
}
struct MessageUserModel {
    MessageModel message;
    UserModel user;
}

contract PublicMessaging {
    address private owner;
    uint256 private balance;
    uint256 public totalActiveMessages;
    uint256 public fee = 0.01 ether;
    mapping(address => UserModel) private userListByAddressMap;
    mapping(uint256 => MessageModel) private messageLisByIdMap;
    mapping(address => uint256) private lastReadMessageIdByUserAddressMap;
    event MessageSent(
        uint256 indexed id,
        string content,
        address indexed sender
    );
    event UserCreated(address indexed sender, string name);
    event BalanceWithdrawn(address indexed recipient, uint256 amount);
    event MessageDeleted(uint256 indexed id);
    event UnreadUpdated(MessageUserModel[]);

    /**
     * @dev initialize the owner.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Writes a new message with the given content.
     * @param content {string}
     */
    function writeMessage(string memory content) external onlyActiveUser {
        require(
            bytes(content).length <= 300,
            "The message exceeds 300 characters"
        );
        messageLisByIdMap[totalActiveMessages] = MessageModel(
            totalActiveMessages,
            content,
            msg.sender,
            false,
            block.timestamp
        );
        emit MessageSent(totalActiveMessages, content, msg.sender);
        totalActiveMessages++;
    }

    /**
     * @dev Creates a new user with the given name.
     * @param name {string}
     */
    function createUser(string memory name) external payable {
        require(bytes(name).length > 0, "Nickname must not be empty");
        require(
            bytes(userListByAddressMap[msg.sender].name).length == 0,
            "User already exists"
        );
        require(msg.value >= fee, "Insufficient value");
        userListByAddressMap[msg.sender] = UserModel(
            name,
            msg.sender,
            true,
            block.timestamp
        );
        emit UserCreated(msg.sender, name);
        balance += msg.value;
    }

    /**
     * @dev Retrieves the number of unread messages for the calling user.
     * @return unreadMsg {uint256}
     */
    function getUserUnreadMessageCount()
        external
        view
        onlyActiveUser
        returns (uint256)
    {
        return
            totalActiveMessages - lastReadMessageIdByUserAddressMap[msg.sender];
    }

    /**
     * @dev Retrieves the combined MessageUserModel array for a given range of messages.
     * @param starIndex {uint256}
     * @param maxIndex {uint256}
     * @return MessageUserModel {MessageUserModel[]}
     */
    function getMessageUserModelMap(
        uint256 starIndex,
        uint256 maxIndex
    ) internal view returns (MessageUserModel[] memory) {
        MessageUserModel[] memory messageUserModel = new MessageUserModel[](
            maxIndex - starIndex
        );
        for (uint256 i = starIndex; i < maxIndex; i++) {
            if (!messageLisByIdMap[i].isDeleted) {
                messageUserModel[i].user = userListByAddressMap[
                    messageLisByIdMap[i].sender
                ];
                messageUserModel[i].message = messageLisByIdMap[i];
            }
        }
        return messageUserModel;
    }

    /**
     * @dev Retrieves all messages.
     * @return MessageUserModel {MessageUserModel[]}
     */
    function getAllMessages()
        external
        view
        returns (MessageUserModel[] memory)
    {
        MessageUserModel[] memory response = getMessageUserModelMap(
            0,
            totalActiveMessages
        );
        return response;
    }

    /**
     * @dev Marks all messages of the calling user as read.
     * @param user {address}
     */
    function updateUserMessagesAsRead(address user) internal {
        lastReadMessageIdByUserAddressMap[user] = totalActiveMessages;
    }

    /**
     * @dev Retrieves the unread messages for the calling user.
     * @return MessageUserModel {MessageUserModel[]}
     */
    function getUserUnreadMessages()
        external
        view
        onlyActiveUser
        returns (MessageUserModel[] memory)
    {
        uint256 startingIndex = lastReadMessageIdByUserAddressMap[msg.sender];
        MessageUserModel[] memory unreadMessages = getMessageUserModelMap(
            startingIndex,
            totalActiveMessages
        );
        return unreadMessages;
    }

    /**
     * @dev Updates to read the unread messages for the calling user and emits.
     */
    function updateUserMessageAsReadAndEmit() external onlyActiveUser {
        uint256 startingIndex = lastReadMessageIdByUserAddressMap[msg.sender];
        MessageUserModel[] memory unreadMessages = getMessageUserModelMap(
            startingIndex,
            totalActiveMessages
        );
        updateUserMessagesAsRead(msg.sender);
        emit UnreadUpdated(unreadMessages);
    }

    /**
     * @dev returns user by address
     * @param user {address}
     */
    function getUser(
        address user
    ) external view onlyActiveUser returns (UserModel memory) {
        require(
            bytes(userListByAddressMap[user].name).length != 0,
            "User Not Exist"
        );
        return userListByAddressMap[user];
    }

    /**
     * @dev changes user name
     * @param name {string}
     */
    function updateUserName(
        string memory name
    ) external payable onlyActiveUser {
        require(msg.value >= 0.001 ether, "Insufficient value");
        userListByAddressMap[msg.sender].name = name;
    }

    /**
     * @dev set isDelete prop to true
     * @param id {uint256}
     */
    function deleteMessage(uint256 id) external onlyActiveUser {
        require(
            bytes(messageLisByIdMap[id].content).length != 0,
            "Message not found."
        );
        require(
            messageLisByIdMap[id].sender == msg.sender || msg.sender == owner,
            "Sender is not authorized"
        );
        require(!messageLisByIdMap[id].isDeleted, "Message is deleted");
        messageLisByIdMap[id].isDeleted = true;
        totalActiveMessages--;
        emit MessageDeleted(id);
    }

    /**
     * @dev Tranfers contract balance to owner.
     */
    function withdrawBalance() external onlyOwner {
        require(balance > 0, "No balance available to withdraw");
        payable(msg.sender).transfer(balance);
        emit BalanceWithdrawn(owner, balance);
        balance = 0;
    }

    /**
     * @dev Change user active prop.
     * @param user {address}
     */
    function disableUser(address user) external onlyOwner {
        require(
            bytes(userListByAddressMap[user].name).length != 0,
            "User not found."
        );
        userListByAddressMap[user].active = !userListByAddressMap[user].active;
    }

    /**
     * @dev Change regiser fee.
     * @param newFee {uint256}
     */
    function setFee(uint256 newFee) external onlyOwner {
        fee = newFee;
    }

    /**
     * @dev Modifier that checks if the sender is a registered user.
     */
    modifier onlyActiveUser() {
        UserModel memory user = userListByAddressMap[msg.sender];
        require(
            bytes(userListByAddressMap[msg.sender].name).length != 0,
            "Sender is not authorized"
        );
        require(userListByAddressMap[msg.sender].active, "User inactive");
        _;
    }
    /**
     * @dev Modifier that checks if the sender is a registered user.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized");
        _;
    }
}
