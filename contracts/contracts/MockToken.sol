// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MockToken is ERC20 {
    using MessageHashUtils for bytes32;

    uint8 private _decimals;
    address public relayer;
    mapping(uint256 => bool) public usedNonces;

    constructor(
        string memory name, 
        string memory symbol, 
        uint8 decimals_, 
        address relayer_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        relayer = relayer_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Keep basic mint for compatibility, but restrict it strictly to the relayer
    function mint(address to, uint256 amount) external {
        require(msg.sender == relayer, "Only relayer can mint directly");
        _mint(to, amount);
    }

    // Secure minting function that requires a relayer's cryptographic signature
    function mintSecure(
        address to, 
        uint256 amount, 
        uint256 nonce, 
        bytes calldata signature
    ) external {
        require(!usedNonces[nonce], "Nonce already used");
        
        // Hash the parameters including this contract address to prevent cross-token replay attacks
        bytes32 messageHash = keccak256(abi.encodePacked(to, amount, nonce, address(this)));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == relayer, "Invalid relayer signature");
        
        usedNonces[nonce] = true;
        _mint(to, amount);
    }
}
