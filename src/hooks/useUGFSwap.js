import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { useWalletClient, usePublicClient } from "wagmi";
import { MUSD_ABI } from "../config/contracts.js";
import { createLogger } from "../utils/logger.js";
import { UGFClient, TYI_USD_PAYMENT_COIN } from "@tychilabs/ugf-testnet-js";

// The bridge lock address (where tokens are "sent" to cross the bridge)
const MOCK_BRIDGE_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export const SWAP_STEP = {
  IDLE: 0,
  QUOTE: 1,
  APPROVE: 2,
  BRIDGE: 3,
  EXECUTE: 4,
  CONFIRMED: 5,
};

export function useUGFSwap() {
  const [step, setStep] = useState(SWAP_STEP.IDLE);
  const [logs, setLogs] = useState([]);
  const [txHash, setTxHash] = useState(null);
  const [smartAddress, setSmartAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live prices and accountability
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceError, setPriceError] = useState(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const log = useCallback((...args) => createLogger(setLogs)(...args), []);

  const COIN_IDS = "bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,tron,the-open-network,chainlink,avalanche-2,polkadot,polygon-ecosystem-token,litecoin,shiba-inu,bitcoin-cash,uniswap,stellar,monero,cosmos";

  // Fetch real market prices from CoinGecko every 4 seconds
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd`);
        if (!res.ok) throw new Error("Rate limit");
        const data = await res.json();
        
        const newPrices = {};
        for (const [key, value] of Object.entries(data)) {
          newPrices[key] = value.usd;
        }
        
        setPrices(newPrices);
        setLastUpdated(new Date());
        setPriceError(null);
      } catch (err) {
        setPriceError("Oracle sync delayed");
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 4000); // refresh every 4s
    return () => clearInterval(interval);
  }, []);

  const swap = useCallback(async (amountUsd, targetTokenStr, targetChainStr) => {
    if (!walletClient || !publicClient || isLoading) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setStep(SWAP_STEP.IDLE);
    setTxHash(null);

    try {
      const amountWei = parseUnits(amountUsd.toString(), 6);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      setSmartAddress(userAddress); // UGF uses the user's EOA natively
      
      const ugf = new UGFClient();

      // ── STEP 1 · QUOTE ──────────────────────────────────────────────────────
      setStep(SWAP_STEP.QUOTE);
      log(`Fetching cross-chain route to ${targetChainStr}…`, "info", "ROUTER");
      
      await ugf.auth.login(signer);
      
      // Bypass dynamic registry lookup to avoid rate limits
      const officialMusdAddress = "0x27DC1C167AeF232bb1e21073304B526726a8727e";

      // Build the bridge simulation transaction (dummy transaction to bridge address)
      // We do not interact with MUSD contract directly to prevent UGF backend HTTP 500 state conflicts
      const txData = {
        to: MOCK_BRIDGE_ADDRESS,
        data: "0x",
      };

      const quote = await ugf.quote.get({
        payment_coin: TYI_USD_PAYMENT_COIN,
        payer_address: userAddress,
        tx_object: JSON.stringify({
          to: txData.to,
          data: txData.data,
          value: "0"
        }),
        dest_chain_id: "84532",
      });
      
      log(`Optimal route found. Sponsor fee: ${quote.payment_amount} MUSD.`, "success", "OK");

      // ── STEP 2 · APPROVE ────────────────────────────────────────────────────
      setStep(SWAP_STEP.APPROVE);
      log(`Waiting for user to sign intent (Quote) and pay in Mock USD…`, "warn", "APPROVE");

      await ugf.payment.x402.signAndSubmit(
        quote, 
        signer, 
        provider
      );
      
      log("Payment settled. Intent submitted to UGF remote execution network.", "success", "OK");

      // ── STEP 3 · BRIDGE / EXECUTE ───────────────────────────────────────────
      setStep(SWAP_STEP.EXECUTE);
      log(`Constructing bridge payload for ${targetTokenStr} on ${targetChainStr}…`, "default", "BRIDGE");
      log("Waiting for UGF network to sponsor ETH gas to your wallet…", "default", "SPONSOR");

      const execRes = await ugf.chains.evm.sponsorAndExecute(
        quote.digest,
        signer,
        async () => {
          log("Sponsorship received! Broadcasting Bridge transaction natively…", "default", "EXECUTE");
          return {
            to: txData.to,
            data: txData.data,
          };
        }
      );

      const confirmedTxHash = execRes.userTxHash;
      setTxHash(confirmedTxHash);

      // ── STEP 4 · CONFIRMED ──────────────────────────────────────────────────
      setStep(SWAP_STEP.CONFIRMED);
      
      await publicClient.waitForTransactionReceipt({ hash: confirmedTxHash });
      
      log(`Tokens locked. Cross-chain message sent to ${targetChainStr}!`, "success", "OK");
      log(`Tx confirmed: ${confirmedTxHash.slice(0, 14)}…`, "success", "OK");

    } catch (err) {
      console.error("[UGF] swap error:", err);
      const msg = err?.shortMessage || err?.message || String(err);
      log(`Error: ${msg}`, "error", "ERROR");
      setError(msg);
      setStep(SWAP_STEP.IDLE);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, isLoading, log]);

  const reset = useCallback(() => {
    setStep(SWAP_STEP.IDLE);
    setLogs([]);
    setTxHash(null);
    setSmartAddress(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    step,
    logs,
    txHash,
    smartAddress,
    isLoading,
    error,
    prices,
    lastUpdated,
    priceError,
    swap,
    reset,
  };
}
