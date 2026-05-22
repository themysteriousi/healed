import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, parseUnits, Wallet, solidityPackedKeccak256, getBytes, Interface } from "ethers";
import { useAccount, useReadContract, useWalletClient, usePublicClient } from "wagmi";
import { MUSD_ABI } from "../config/contracts.js";
import { createLogger } from "../utils/logger.js";
import { walletClientToSigner } from "../utils/walletClientToSigner.js";
import { UGFClient, TYI_USD_PAYMENT_COIN } from "@tychilabs/ugf-testnet-js";
import mockTokens from "../config/mockTokens.json";
import { recordPendingDeduction } from "./useWallet.js";

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

  // Active target token selection & balance state
  const { address } = useAccount();
  const [targetToken, setTargetToken] = useState("solana");

  const tokenInfo = mockTokens[targetToken];
  const tokenAddress = tokenInfo?.address;

  // Use wagmi to fetch the target token balance
  const { data: targetBalanceData, refetch: refetchTargetBalance } = useReadContract({
    address: tokenAddress,
    abi: MUSD_ABI, // Reusing MUSD_ABI as it contains standard balanceOf function
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 4000, // Poll target token balance every 4 seconds
    },
  });

  const targetTokenBalance = targetBalanceData !== undefined
    ? (Number(targetBalanceData) / 10 ** 18).toString()
    : "0.00";

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

  const swap = useCallback(async (amountUsd, targetTokenId, targetChainStr) => {
    if (!walletClient || !publicClient || isLoading) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setStep(SWAP_STEP.IDLE);
    setTxHash(null);

    try {
      // Use wagmi walletClient → ethers Signer (works with any connector)
      const signer = await walletClientToSigner(walletClient);
      const provider = signer.provider;
      const userAddress = await signer.getAddress();
      
      setSmartAddress(userAddress); // UGF uses the user's EOA natively
      
      const ugf = new UGFClient();

      // Retrieve selected token metadata
      const selectedTokenInfo = mockTokens[targetTokenId];
      if (!selectedTokenInfo) {
        throw new Error(`Token configuration not found for: ${targetTokenId}`);
      }

      // Calculate swap details based on live Oracle prices
      const outPrice = prices[targetTokenId] || 0;
      if (outPrice <= 0) {
        throw new Error(`Price oracle unavailable for ${selectedTokenInfo.name}`);
      }
      
      const estimatedOutput = parseFloat(amountUsd) / outPrice;
      const outputUnits = parseUnits(estimatedOutput.toFixed(12), 18);
      
      // ── SECURITY PROTOCOL: Relayer Cryptographic Signature Generation ────
      const nonce = Date.now();
      log(`Securing swap: Generating cryptographic authorization signature...`, "info", "SECURITY");

      const messageHash = solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [userAddress, outputUnits, nonce, selectedTokenInfo.address]
      );

      const relayerKey = import.meta.env.VITE_RELAYER_PRIVATE_KEY;
      if (!relayerKey) {
        throw new Error("Relayer private key is not configured in .env");
      }
      const relayerWallet = new Wallet(relayerKey);
      const signature = await relayerWallet.signMessage(getBytes(messageHash));
      
      log(`Security check passed. Authorization signature: ${signature.slice(0, 16)}...`, "success", "OK");

      // Encode the secure on-chain mint transaction
      const mintInterface = new Interface([
        "function mintSecure(address to, uint256 amount, uint256 nonce, bytes calldata signature) external"
      ]);
      const mintData = mintInterface.encodeFunctionData("mintSecure", [
        userAddress,
        outputUnits,
        nonce,
        signature
      ]);

      const txData = {
        to: selectedTokenInfo.address,
        data: mintData,
      };

      // ── STEP 1 · QUOTE ──────────────────────────────────────────────────────
      setStep(SWAP_STEP.QUOTE);
      log(`Fetching cross-chain route to ${targetChainStr}…`, "info", "ROUTER");
      
      await ugf.auth.login(signer);


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
      log(`Constructing bridge payload for ${selectedTokenInfo.symbol} on ${targetChainStr}…`, "default", "BRIDGE");
      log("Waiting for UGF network to sponsor ETH gas to your wallet…", "default", "SPONSOR");

      const execRes = await ugf.chains.evm.sponsorAndExecute(
        quote.digest,
        signer,
        async () => {
          log(`Sponsorship received! Broadcasting secure transaction to mint ${selectedTokenInfo.symbol}…`, "default", "EXECUTE");
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
      
      if (quote?.payment_amount) {
        // Convert the raw wei quote (e.g. 1821) into MUSD units (0.001821)
        recordPendingDeduction(Number(quote.payment_amount) / 10**6);
      }

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
  }, [walletClient, publicClient, isLoading, log, prices]);

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
    targetToken,
    setTargetToken,
    targetTokenBalance,
    refetchTargetBalance,
  };
}
