# Universal Gas Framework (UGF) Super-App

A gasless Web3 onboarding hub built for the UGF Hackathon. This project demonstrates how to completely eliminate the need for traditional ERC-4337 Smart Accounts and Paymasters, replacing them with the **Universal Gas Framework (UGF)** intent-based architecture.

This project tackles two primary hackathon tracks simultaneously:
1. **Minting Track:** A gasless Badge Minter for Web2 user onboarding.
2. **Wallet & Agents Track (DeFi):** A gasless Universal Swap simulation for cross-chain liquidity.

---

## 🏗️ Architectural Paradigm Shift: The Old vs. The New

Before UGF, achieving "gasless" transactions in Web3 required complex Account Abstraction (ERC-4337) infrastructure. 

### ❌ The Old Way (Pimlico / ERC-4337)
Previously, this application relied on `pimlico`, `permissionless.js`, and Wagmi Smart Accounts:
1. Users could not use their default MetaMask wallets natively.
2. The application had to securely deploy and manage a separate **Smart Account** smart contract for every single user.
3. Transactions had to be bundled into `UserOperations` and routed through a centralized **Paymaster** service to cover gas fees.
4. **The Flaw:** Extremely complex developer overhead, high contract deployment costs, and fractured wallet UX.

### ✅ The New Way (UGF SDK / Intents)
We completely stripped out Pimlico and the Smart Account configs, transitioning purely to standard Externally Owned Accounts (EOAs) powered by `@tychilabs/ugf-testnet-js`.
1. Users use their default, standard MetaMask wallets. No Smart Accounts needed!
2. Users sign an **off-chain x402 Intent** agreeing to pay for gas using stablecoins (`TYI_MOCK_USD`).
3. The UGF decentralized network receives the intent and dynamically airdrops "Just-In-Time" (JIT) native gas (Base Sepolia ETH) directly into the user's wallet.
4. The user's wallet then broadcasts the transaction natively, paying the gas with the newly sponsored ETH.

---

## 🛠️ Major Codebase Changes

### 1. Stripping Legacy Infrastructure
* **Removed:** All dependencies relating to Pimlico, `permissionless.js`, and Wagmi Smart Account clients.
* **Added:** `@tychilabs/ugf-testnet-js` for UGF intent routing and standard `ethers.js` (v6) for contract simulation and RPC interactions.
* **Config:** Shifted `wagmi.js` back to standard Web3Modal EOA setups.

### 2. The NFT Minting Engine (`useUGFMint.js`)
We rebuilt the Badge Minter from the ground up to utilize the UGF API:
* **JSON Payload Stringification:** Overcame initial `HTTP 400` server rejections by dynamically stringifying the `tx_object` payload directly from ethers' `populateTransaction`.
* **x402 Intent Routing:** Swapped out the incompatible Vault API for the hackathon's required **`x402.signAndSubmit`** cryptographic intent endpoint.
* **Native Execution:** Chained the intent to `ugf.chains.evm.sponsorAndExecute` to allow native, gasless minting directly from the user's standard MetaMask EOA.

### 3. The Universal Swap Engine (`useUGFSwap.js`)
We elevated the project into the DeFi/Wallet track by heavily refactoring the cross-chain swap integration:
* **Token Mechanics:** Re-aligned `parseUnits` to accurately read `6` decimals for the Mock USD stablecoin.
* **Oracle Security:** Bypassed the UGF API's fragile dynamic token registry lookup to eliminate catastrophic `HTTP 429` rate limits.
* **Simulation Integrity:** Solved an `HTTP 500` server crash caused by simulating a transaction against the payment token itself. We safely rerouted the simulated payload to a mock bridge address (`0x00...dEaD`), completely neutralizing state conflicts on the UGF backend while preserving the JIT funding loop.

### 4. UI Polish & Branding (`SplitScreenDemo.jsx` / `SwapPanel.jsx`)
* Rebranded all interface touchpoints from "Sponsored by Pimlico" to accurately reflect "Sponsored by UGF SDK".
* Upgraded the Engine Logs to track the 4-step intent lifecycle in real-time.

---

## 🚀 The UGF Workflow (End-to-End)

When a user clicks "Mint Badge" or "Swap Cross-Chain":

1. **[QUOTE]** The application simulates the transaction locally via `ethers.js` and sends the payload to the UGF API to fetch an optimal gas quote priced in Mock USD.
2. **[APPROVE MUSD]** The user is prompted via MetaMask to sign an `x402` EIP-712 Intent, cryptographically agreeing to pay the quoted Mock USD to the relayer.
3. **[SPONSOR]** The UGF backend validates the signature and sends a micro-transaction of Base Sepolia ETH directly to the user's wallet.
4. **[EXECUTE]** The application detects the inbound ETH and natively broadcasts the final payload (`claimBadge` or `BridgeLock`) to the blockchain.
5. **[CONFIRMED]** The user successfully interacts with a smart contract without ever natively holding the required gas token.
