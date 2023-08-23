// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contrato que cuenta los mensajes
contract MessageCounter {
    uint256 private messageAmount;
    uint256 public activeMessageAmount;
    address public owner;
    event Increased(uint256 messageAmount);
    event Decreased(uint256 messageAmount);

    constructor() {
        messageAmount = 0;
        owner = msg.sender;
    }

    function increaseActive() public onlyOwner {
        activeMessageAmount += 1;
        emit Increased(messageAmount);
    }

    function decreaseActive() public onlyOwner {
        activeMessageAmount -= 1;
        emit Decreased(messageAmount);
    }

    function increaseTotal() public onlyOwner {
        messageAmount += 1;
    }

    function changeOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function getTotalActiveMessages() external view returns (uint256) {
        return activeMessageAmount;
    }

    function getTotalMessages() external view returns (uint256) {
        return messageAmount;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized");
        _;
    }
}
