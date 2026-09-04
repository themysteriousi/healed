// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title BadgeNFT – Hackathon 2025 Finisher badge, paid gaslessly in MUSD via UGF
contract BadgeNFT is ERC721 {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    mapping(address => bool) public hasClaimed;

    event BadgeMinted(address indexed to, uint256 tokenId);

    constructor() ERC721("Hackathon 2025 Finisher", "HF25") {}

    /// @notice Claim a badge gaslessly via Universal Gas Framework
    function claimBadge() external returns (uint256 tokenId) {
        tokenId = ++_tokenIdCounter;
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, tokenId);

        emit BadgeMinted(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "BadgeNFT: nonexistent token");

        bytes memory json = abi.encodePacked(
            '{"name":"Hackathon 2025 Finisher #', tokenId.toString(), '",',
            '"description":"Minted gaslessly via Universal Gas Framework on Base Sepolia.",',
            '"image":"https://api.dicebear.com/7.x/shapes/svg?seed=', tokenId.toString(), '",',
            '"attributes":[',
            '{"trait_type":"Edition","value":"Hackathon 2025"},',
            '{"trait_type":"Minted Via","value":"Universal Gas Framework"},',
            '{"trait_type":"Token ID","value":"', tokenId.toString(), '"}',
            ']}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
