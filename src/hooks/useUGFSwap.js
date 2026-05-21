import { useState, useCallback, useEffect } from "react";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { useWalletClient, usePublicClient } from "wagmi";
import { MUSD_ADDRESS, MUSD_ABI } from "../config/contracts.js";
import { createLogger } from "../utils/logger.js";

const PIMLICO_KEY = import.meta.env.VITE_PIMLICO_API_KEY;
const PIMLICO_RPC = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`;

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
      const amountWei = parseUnits(amountUsd.toString(), 18);

      // ── STEP 1 · QUOTE ──────────────────────────────────────────────────────
      setStep(SWAP_STEP.QUOTE);
      log(`Fetching cross-chain route to ${targetChainStr}…`, "info", "ROUTER");

      const pimlicoClient = createPimlicoClient({
        transport: http(PIMLICO_RPC),
        entryPoint: { address: entryPoint07Address, version: "0.7" },
      });

      const account = await toSimpleSmartAccount({
        client: publicClient,
        owner: walletClient,
        entryPoint: { address: entryPoint07Address, version: "0.7" },
      });

      const sa = account.address;
      setSmartAddress(sa);
      log(`Smart Account active: ${sa.slice(0, 8)}…`, "info", "INFO");

      // Simulate Li.Fi / Squid API delay
      await new Promise((r) => setTimeout(r, 1000));

      const gasPrices = await pimlicoClient.getUserOperationGasPrice();
      log(`Optimal route found. Native gas fully sponsored.`, "success", "OK");

      const smartAccountClient = createSmartAccountClient({
        account,
        chain: sepolia,
        bundlerTransport: http(PIMLICO_RPC),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => gasPrices.fast,
        },
      });

      // ── STEP 2 · APPROVE ────────────────────────────────────────────────────
      setStep(SWAP_STEP.APPROVE);
      log("Building token allowance calldata…", "warn", "APPROVE");

      const approveData = encodeFunctionData({
        abi: MUSD_ABI,
        functionName: "approve",
        args: [MOCK_BRIDGE_ADDRESS, amountWei],
      });

      // ── STEP 3 · BRIDGE ─────────────────────────────────────────────────────
      setStep(SWAP_STEP.BRIDGE);
      log(`Constructing bridge payload for ${targetTokenStr} on ${targetChainStr}…`, "default", "BRIDGE");

      // In a real app, this would be a call to the Li.Fi or LayerZero router contract.
      // Here we simulate the bridge lock by sending to a burn address.
      const transferData = encodeFunctionData({
        abi: MUSD_ABI,
        functionName: "transfer",
        args: [MOCK_BRIDGE_ADDRESS, amountWei],
      });

      // ── STEP 4 · EXECUTE ────────────────────────────────────────────────────
      setStep(SWAP_STEP.EXECUTE);
      log("Broadcasting batched UserOp (Approve + Bridge)…", "default", "CHAIN");

      const calls = [
        { to: MUSD_ADDRESS, data: approveData, value: 0n },
        { to: MUSD_ADDRESS, data: transferData, value: 0n },
      ];

      const userOpHash = await smartAccountClient.sendTransaction({ calls });

      log(`UserOp hash: ${userOpHash.slice(0, 14)}…`, "default", "CHAIN");
      log("Waiting for on-chain confirmation…", "default", "CHAIN");

      const receipt = await pimlicoClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 300_000, 
      });

      const confirmedTxHash = receipt.receipt.transactionHash;
      setTxHash(confirmedTxHash);

      // ── STEP 5 · CONFIRMED ──────────────────────────────────────────────────
      setStep(SWAP_STEP.CONFIRMED);
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
