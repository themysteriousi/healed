// ─── Contract addresses (filled from .env after deployment) ──────────────────
export const MUSD_ADDRESS = import.meta.env.VITE_MUSD_ADDRESS;
export const BADGE_NFT_ADDRESS = import.meta.env.VITE_BADGE_NFT_ADDRESS;

// ─── UGF Official Registry MUSD address (Base Sepolia) ───────────────────────
// Deployed 2026-05-22 alongside BadgeNFT. BadgeNFT.musd() confirmed to match.
// Raw MINT_FEE = 80000 (6 decimals) = $0.08 MUSD ✅
export const UGF_MUSD_ADDRESS = "0xb155fc98A7346f2bf1dfF970566774AFfFE5fE53";

// ─── MockUSD ABI (minimal – only what the frontend needs) ────────────────────
export const MUSD_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
];

// ─── BadgeNFT ABI (minimal) ───────────────────────────────────────────────────
export const BADGE_NFT_ABI = [
  {
    name: "hasClaimed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "claimBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "MINT_FEE",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "BadgeMinted",
    type: "event",
    inputs: [
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
    ],
  },
];
