// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract that counts messages
contract MessageCounter {
    uint256 private messageAmount; // Total count of messages
    uint256 public activeMessageAmount; // Count of currently active messages
    address public owner; // Address of the contract owner
    event Increased(uint256 messageAmount); // Event emitted when active messages increase
    event Decreased(uint256 messageAmount); // Event emitted when active messages decrease

    constructor() {
        messageAmount = 0;
        owner = msg.sender;
    }

    // Increase the count of active messages (only callable by the owner)
    function increaseActive() public onlyOwner {
        activeMessageAmount += 1;
        emit Increased(activeMessageAmount);
    }

    // Decrease the count of active messages (only callable by the owner)
    function decreaseActive() public onlyOwner {
        activeMessageAmount -= 1;
        emit Decreased(activeMessageAmount);
    }

    // Increase the total count of messages (only callable by the owner)
    function increaseTotal() public onlyOwner {
        messageAmount += 1;
    }

    // Change the owner of the contract (only callable by the owner)
    function changeOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    // Get the total count of active messages
    function getTotalActiveMessages() external view returns (uint256) {
        return activeMessageAmount;
    }

    // Get the total count of messages
    function getTotalMessages() external view returns (uint256) {
        return messageAmount;
    }

    // Modifier to ensure that only the owner can call certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized");
        _;
    }
}
