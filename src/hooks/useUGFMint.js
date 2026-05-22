import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useWalletClient, usePublicClient } from "wagmi";
import { BADGE_NFT_ADDRESS, BADGE_NFT_ABI } from "../config/contracts.js";
import { createLogger } from "../utils/logger.js";
import { UGFClient, TYI_USD_PAYMENT_COIN } from "@tychilabs/ugf-testnet-js";
import { recordPendingDeduction } from "./useWallet.js";

export const STEP = {
  IDLE: 0,
  QUOTE: 1,
  APPROVE: 2,
  EXECUTE: 3,
  CONFIRMED: 4,
};

export function useUGFMint() {
  const [step, setStep] = useState(STEP.IDLE);
  const [logs, setLogs] = useState([]);
  const [txHash, setTxHash] = useState(null);
  const [smartAddress, setSmartAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // To track the minted token ID
  const [tokenId, setTokenId] = useState(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const log = useCallback((...args) => createLogger(setLogs)(...args), []);

  const mint = useCallback(async () => {
    if (!walletClient || !publicClient || isLoading) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setStep(STEP.IDLE);
    setTxHash(null);
    setTokenId(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // In UGF, the user's EOA is the actor, no Smart Account needed!
      setSmartAddress(userAddress);
      
      // Initialize UGF SDK
      const ugf = new UGFClient();

      // ── STEP 1 · QUOTE ──────────────────────────────────────────────────────
      setStep(STEP.QUOTE);
      log("Authenticating with Universal Gas Framework…", "info", "AUTH");
      
      // 1. Login to UGF to get a session token
      await ugf.auth.login(signer);

      // 2. Fetch the dynamic Mock USD address from the official Registry
      log("Fetching official Mock USD registry data…", "info", "REGISTRY");
      const paymentOption = await ugf.registry.getOption(TYI_USD_PAYMENT_COIN);
      const musdChainEntry = paymentOption.chains.find((c) => c.chain_id === "84532");
      if (!musdChainEntry) throw new Error("Mock USD not found on Base Sepolia registry");
      const officialMusdAddress = musdChainEntry.address;

      // 3. Build the target transaction data (Minting the NFT)
      const nftContract = new Contract(BADGE_NFT_ADDRESS, BADGE_NFT_ABI, signer);
      const txData = await nftContract.claimBadge.populateTransaction();

      log("Requesting gas sponsorship quote from UGF nodes…", "info", "QUOTE");
      
      // 4. Get a Quote from the UGF network
      const quote = await ugf.quote.get({
        payment_coin: TYI_USD_PAYMENT_COIN,
        payer_address: userAddress,
        tx_object: JSON.stringify({
          to: txData.to,
          data: txData.data,
          value: "0"
        }),
        dest_chain_id: "84532", // Base Sepolia
      });
      
      log(`Quote received. Gas cost: ${quote.payment_amount} MUSD`, "success", "OK");

      // ── STEP 2 · APPROVE ────────────────────────────────────────────────────
      setStep(STEP.APPROVE);
      log("Waiting for user to sign intent (Quote) and pay in Mock USD…", "warn", "SETTLE");

      // 5. Pay for the quote (x402 Payment Routing for testnet Mock USD)
      // This will prompt the user to sign an EIP-712 intent to pay Mock USD
      const paymentRes = await ugf.payment.x402.signAndSubmit(
        quote, 
        signer, 
        provider
      );
      
      log("Payment settled. Intent submitted to UGF remote execution network.", "success", "OK");

      // ── STEP 3 · EXECUTE ────────────────────────────────────────────────────
      setStep(STEP.EXECUTE);
      log("Waiting for UGF network to sponsor ETH gas to your wallet…", "default", "SPONSOR");

      // 6. Wait for UGF to send ETH to our wallet, then automatically broadcast our Mint tx!
      const execRes = await ugf.chains.evm.sponsorAndExecute(
        quote.digest,
        signer,
        async () => {
          log("Sponsorship received! Broadcasting Mint transaction natively…", "default", "EXECUTE");
          return {
            to: BADGE_NFT_ADDRESS,
            data: txData.data,
          };
        }
      );

      const confirmedTxHash = execRes.userTxHash;
      setTxHash(confirmedTxHash);
      log(`Tx confirmed: ${confirmedTxHash.slice(0, 14)}…`, "success", "OK");

      // ── STEP 4 · CONFIRMED ──────────────────────────────────────────────────
      setStep(STEP.CONFIRMED);
      
      // Optimistically deduct the demo UGF gas cost (0.08 MUSD) from our local UI balance
      recordPendingDeduction(0.08);
      
      // We can use viem's publicClient to get the logs for the UI
      log("Fetching receipt to find Token ID…", "info", "INDEX");
      const txReceipt = await publicClient.waitForTransactionReceipt({ hash: confirmedTxHash });
      
      // Find the BadgeMinted log
      const mintLog = txReceipt.logs.find(
        (l) => l.address.toLowerCase() === BADGE_NFT_ADDRESS.toLowerCase()
      );
      if (mintLog && mintLog.topics[3]) {
        const id = BigInt(mintLog.topics[3]).toString();
        setTokenId(id);
        log(`Successfully minted Hackathon Badge #${id}!`, "success", "OK");
      } else {
        log(`Mint successful, but Token ID not found in logs.`, "success", "OK");
      }

    } catch (err) {
      console.error("[UGF] mint error:", err);
      const msg = err?.shortMessage || err?.message || String(err);
      log(`Error: ${msg}`, "error", "ERROR");
      setError(msg);
      setStep(STEP.IDLE);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, isLoading, log]);

  const reset = useCallback(() => {
    setStep(STEP.IDLE);
    setLogs([]);
    setTxHash(null);
    setSmartAddress(null);
    setError(null);
    setTokenId(null);
    setIsLoading(false);
  }, []);

  return {
    step,
    logs,
    txHash,
    smartAddress,
    tokenId,
    isLoading,
    error,
    mint,
    reset,
  };
}
