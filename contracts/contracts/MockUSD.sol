// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSD – ERC-20 faucet token for UGF demo
contract MockUSD is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** 18; // 100 MUSD per drip

    constructor() ERC20("Mock USD", "MUSD") {}

    /// @notice Anyone can call this to receive 100 MUSD for testing.
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner-less open mint for hackathon / test purposes.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
