// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contrato que cuenta los mensajes
contract MessageCounter {
    uint256 public messageAmount;
    address public owner;
    event Increased(uint256 messageAmount);
    event Decreased(uint256 messageAmount);

    constructor() {
        messageAmount = 0;
        owner = msg.sender;
    }

    function increase() public onlyOwner {
        messageAmount += 1;
        emit Increased(messageAmount);
    }

    function decrease() public onlyOwner {
        messageAmount -= 1;
        emit Decreased(messageAmount);
    }

    function changeOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    /**
     * @dev Retrieves all messages.
     * @return MessageUserModel {MessageUserModel[]}
     */
    function getTotalMessages() external view returns (uint256) {
        return messageAmount;
    }

    /**
     * @dev Modifier that checks if the sender is owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized");
        _;
    }
}
