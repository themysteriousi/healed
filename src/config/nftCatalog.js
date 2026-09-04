// src/config/nftCatalog.js
// ── NFT Tier Catalog ──────────────────────────────────────────────────────────
// Each tier maps to a different MUSD price point for the mint fee.
// The on-chain contract (BadgeNFT) mints them all the same way — only the
// MUSD approve amount changes. Tier data is frontend-only.

export const NFT_CATALOG = [
  {
    id: "hacker-pass",
    name: "Hacker Pass",
    description: "Entry-level hackathon credential. Proof you shipped.",
    priceMUSD: 0.08,
    priceDisplay: "$0.08",
    rarity: "Common",
    rarityColor: "text-slate-400",
    borderColor: "border-slate-600/50",
    bgGradient: "from-slate-900/60 to-slate-800/40",
    glowColor: "shadow-slate-500/10",
    accentColor: "text-slate-300",
    badgeColor: "bg-slate-700/60 text-slate-300",
  },
  {
    id: "builder-badge",
    name: "Builder Badge",
    description: "For builders who go beyond the basics.",
    priceMUSD: 0.25,
    priceDisplay: "$0.25",
    rarity: "Uncommon",
    rarityColor: "text-green-400",
    borderColor: "border-green-600/40",
    bgGradient: "from-green-950/50 to-slate-900/60",
    glowColor: "shadow-green-500/10",
    accentColor: "text-green-300",
    badgeColor: "bg-green-900/60 text-green-400",
  },
  {
    id: "pioneer-token",
    name: "Pioneer Token",
    description: "Reserved for those who pioneer new territory in Web3.",
    priceMUSD: 1.0,
    priceDisplay: "$1.00",
    rarity: "Rare",
    rarityColor: "text-blue-400",
    borderColor: "border-blue-600/40",
    bgGradient: "from-blue-950/50 to-slate-900/60",
    glowColor: "shadow-blue-500/15",
    accentColor: "text-blue-300",
    badgeColor: "bg-blue-900/60 text-blue-400",
  },
  {
    id: "legend-edition",
    name: "Legend Edition",
    description: "Ultra-rare. Only for the legends who shaped the ecosystem.",
    priceMUSD: 5.0,
    priceDisplay: "$5.00",
    rarity: "Legendary",
    rarityColor: "text-yellow-400",
    borderColor: "border-yellow-500/40",
    bgGradient: "from-yellow-950/40 to-slate-900/60",
    glowColor: "shadow-yellow-500/20",
    accentColor: "text-yellow-300",
    badgeColor: "bg-yellow-900/60 text-yellow-400",
  },
];

export const DEFAULT_NFT = NFT_CATALOG[0];
