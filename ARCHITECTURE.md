# 🏗️ Architecture — Universal Gas Framework (UGF) Demo

> A live ERC-4337 gasless NFT minting demo on **Ethereum Sepolia**, powered by **Pimlico**.
> Users mint a Hackathon Badge NFT paying only **$0.08 MUSD** — zero ETH required at any step.

---

## 📌 What This Project Does

Traditional Web3 forces users to hold ETH just to pay gas fees — a massive UX barrier.
**UGF solves this** by using **ERC-4337 Account Abstraction**:

- Users connect their MetaMask wallet (EOA)
- A **Smart Account** is derived from their EOA (no deployment needed upfront)
- Pimlico's **Verifying Paymaster** sponsors all gas fees on-chain
- The user pays only **0.08 MUSD** (a test stablecoin) — no ETH ever leaves their wallet

---

## 🗂️ Project Structure

```
healed/
├── src/                        # React frontend
│   ├── main.jsx                # App entry point
│   ├── App.jsx                 # Root component (wraps with WalletConnect providers)
│   ├── SplitScreenDemo.jsx     # 3-column layout (Left | Right | Engine Log)
│   │
│   ├── components/
│   │   ├── LeftPanel.jsx       # "Without UGF" — shows the old broken Web3 UX
│   │   ├── RightPanel.jsx      # "With UGF" — wallet info, faucet, mint button
│   │   ├── EngineLog.jsx       # Live transaction step log (Quote→Approve→Confirm)
│   │   ├── WalletConnect.jsx   # MetaMask connect button + network switch guard
│   │   └── NFTPreview.jsx      # Badge NFT card display after minting
│   │
│   ├── hooks/
│   │   ├── useWallet.js        # Wallet state: address, chain, MUSD balance, hasClaimed
│   │   └── useUGFMint.js       # Core UGF pipeline: derives Smart Account, builds & sends UserOp
│   │
│   ├── config/
│   │   ├── wagmi.js            # Wagmi + RainbowKit config (Sepolia chain + RPC)
│   │   └── contracts.js        # Contract addresses + minimal ABIs (MUSD + BadgeNFT)
│   │
│   └── utils/
│       └── logger.js           # Helper to push timestamped log entries to EngineLog
│
├── contracts/                  # Hardhat smart contract workspace
│   ├── contracts/
│   │   ├── MockUSD.sol         # ERC-20 faucet token (100 MUSD free per call)
│   │   └── BadgeNFT.sol        # ERC-721 badge (costs 0.08 MUSD, one per wallet)
│   ├── scripts/
│   │   └── deploy.cjs          # Hardhat deploy script
│   └── hardhat.config.js       # Hardhat config (Sepolia network + deployer key)
│
├── .env                        # 🔒 Secret keys — never committed to git
└── ARCHITECTURE.md             # This file
```

---

## 🔗 Deployed Contracts (Ethereum Sepolia)

| Contract  | Address                                      |
|-----------|----------------------------------------------|
| MockUSD   | `0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2` |
| BadgeNFT  | `0xc61105160182bB0292753a5020F23ae79054F2fb` |

---

## 🧩 Architecture Diagram

```
USER (MetaMask / EOA)
        │
        │  signs UserOp (no ETH needed)
        ▼
┌─────────────────────┐
│   Smart Account     │  ← Derived from EOA via toSimpleSmartAccount()
│  (ERC-4337 Wallet)  │     Address: deterministic, deployed on first use
└────────┬────────────┘
         │
         │  Batched UserOperation:
         │   1. MockUSD.faucet()       → Smart Account receives 100 MUSD
         │   2. MockUSD.approve()      → Approves BadgeNFT to spend 0.08 MUSD
         │   3. BadgeNFT.claimBadge()  → Mints NFT, deducts 0.08 MUSD
         ▼
┌─────────────────────┐        ┌────────────────────────┐
│   Pimlico Bundler   │◄──────►│  Pimlico Paymaster     │
│  (submits UserOp)   │        │  (sponsors all gas)    │
└────────┬────────────┘        └────────────────────────┘
         │
         │  on-chain tx
         ▼
┌─────────────────────────────────────────────┐
│           Ethereum Sepolia Blockchain        │
│                                             │
│  EntryPoint (ERC-4337)  0x000...6f37da032   │
│       │                                     │
│       ├──► MockUSD.sol  (ERC-20 token)      │
│       └──► BadgeNFT.sol (ERC-721 NFT)       │
└─────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite |
| **Wallet Connection** | Wagmi v3 + RainbowKit v2 |
| **Blockchain Client** | viem v2 |
| **Account Abstraction** | permissionless.js v0.3 |
| **Bundler / Paymaster** | Pimlico (ERC-4337 v0.7) |
| **Smart Contracts** | Solidity 0.8.20 + OpenZeppelin |
| **Contract Dev** | Hardhat |
| **Network** | Ethereum Sepolia Testnet |

---

## 🔄 UGF Mint Flow (Step by Step)

```
User clicks "Mint Badge"
        │
        ▼
[STEP 1 · QUOTE]
  - Derive Smart Account address from MetaMask EOA
  - Check if badge already claimed → if yes, skip to CONFIRMED instantly
  - Fetch gas price quote from Pimlico
        │
        ▼
[STEP 2 · APPROVE]
  - Encode MockUSD.approve(BadgeNFT, 0.08 MUSD) calldata
  - Check if Smart Account already has enough MUSD
        │
        ▼
[STEP 3 · SETTLE]
  - Encode BadgeNFT.claimBadge() calldata
  - Build batch of calls: [faucet?] + [approve] + [claimBadge]
        │
        ▼
[STEP 4 · EXECUTE]
  - Send batched UserOperation via Pimlico bundler
  - Pimlico Paymaster signs and sponsors gas
  - User signs UserOp with MetaMask (no ETH prompt)
        │
        ▼
[STEP 5 · CONFIRMED]
  - Wait for UserOp receipt (up to 5 minutes)
  - Parse BadgeMinted event → extract Token ID
  - Display NFT badge card with token details
```

---

## 🔐 Environment Variables

Create a `.env` file in the root (never commit this):

```env
# Pimlico API key — get free at https://dashboard.pimlico.io
VITE_PIMLICO_API_KEY=your_pimlico_key_here

# Contract addresses (filled after running deploy script)
VITE_MUSD_ADDRESS=0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2
VITE_BADGE_NFT_ADDRESS=0xc61105160182bB0292753a5020F23ae79054F2fb
```

Create a `contracts/.env` file (never commit this):

```env
# Deployer wallet private key
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

---

## 🚀 Running Locally

```bash
# 1. Install frontend dependencies
npm install

# 2. Install contract dependencies
cd contracts && npm install && cd ..

# 3. Start the dev server
npm run dev
# → http://localhost:5173
```

### Deploying Contracts (if redeploying)

```bash
cd contracts
npx hardhat run scripts/deploy.cjs --network sepolia
# Copy output addresses into your .env file
```

---

## 🎭 UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UGF · Live Demo · Sepolia                       │  ← Header
├─────────────────────────────────────────────────────────────────────┤
│          From Clunky ETH gas hell → Invisible Web2-like UX          │  ← Hero
├───────────────────┬─────────────────────┬───────────────────────────┤
│                   │                     │                           │
│   LEFT PANEL      │    RIGHT PANEL      │    UGF ENGINE LOG         │
│                   │                     │                           │
│  "Without UGF"    │  "With UGF"         │  • Quote                  │
│  ─────────────    │  ─────────────      │  • Approve MUSD           │
│  Shows old UX:    │  Shows new UX:      │  • Settle                 │
│  • 0.000 ETH      │  • MUSD Balance     │  • Execute On-chain       │
│  • MetaMask popup │  • Badge status     │  • Confirmed ✓            │
│  • Gas error      │  • Faucet button    │                           │
│  • Blocked action │  • Mint button      │  Live tx logs shown here  │
│                   │                     │                           │
└───────────────────┴─────────────────────┴───────────────────────────┘
│              UGF · ERC-4337 · Pimlico Bundler · Sepolia             │  ← Footer
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Design Decisions

| Decision | Reason |
|----------|--------|
| **ERC-4337 over ERC-2771** | No trusted forwarder needed; fully decentralised |
| **SimpleSmartAccount** | Minimal, audited, perfect for demos |
| **Pimlico Verifying Paymaster** | Easiest sponsored gas setup; free tier available |
| **Batched UserOp** | Faucet + Approve + Mint happen atomically in 1 tx |
| **Early-exit detection** | If badge already minted, skip straight to success — no re-submission |
| **Mock USD (MUSD)** | Simulates a real stablecoin fee without real money |
