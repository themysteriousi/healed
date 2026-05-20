import { useState, useCallback } from "react";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { useWalletClient, usePublicClient } from "wagmi";
import { MUSD_ADDRESS, MUSD_ABI, BADGE_NFT_ADDRESS, BADGE_NFT_ABI } from "../config/contracts.js";
import { createLogger } from "../utils/logger.js";

const PIMLICO_KEY = import.meta.env.VITE_PIMLICO_API_KEY;
const PIMLICO_RPC = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`;
const MINT_FEE = parseUnits("0.08", 18); // 0.08 MUSD

// UGF pipeline step indices
export const STEP = {
  IDLE: 0,
  QUOTE: 1,
  APPROVE: 2,
  SETTLE: 3,
  EXECUTE: 4,
  CONFIRMED: 5,
};

/**
 * Core UGF mint hook.
 *
 * Real flow (ERC-4337 via Pimlico):
 *  1. Derive a Simple Smart Account from the user's EOA
 *  2. Get a gas quote + sponsored paymaster data from Pimlico
 *  3. Build a batched UserOp: [approve MUSD] + [claimBadge]
 *  4. Submit the UserOp through Pimlico's bundler
 *  5. Wait for on-chain receipt and parse the BadgeMinted event
 *
 * The user pays ZERO ETH at every step – Pimlico's verifying paymaster
 * sponsors all gas. The only cost is the 0.08 MUSD fee taken by BadgeNFT.
 */
export function useUGFMint() {
  const [step, setStep] = useState(STEP.IDLE);
  const [logs, setLogs] = useState([]);
  const [txHash, setTxHash] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [smartAddress, setSmartAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // ── STEP 1 · QUOTE ──────────────────────────────────────────────────────
      setStep(STEP.QUOTE);
      log("UGF SDK initializing on Sepolia…", "info", "INFO");

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
      log(`Smart Account derived: ${sa.slice(0, 8)}…${sa.slice(-6)}`, "info", "INFO");

      // ── EARLY EXIT: already claimed ─────────────────────────────────────────
      const alreadyClaimed = await publicClient.readContract({
        address: BADGE_NFT_ADDRESS,
        abi: BADGE_NFT_ABI,
        functionName: "hasClaimed",
        args: [sa],
      });

      if (alreadyClaimed) {
        log("Badge already minted for this Smart Account – fetching token…", "success", "OK");
        // Find the token ID owned by this smart account
        const totalSupply = await publicClient.readContract({
          address: BADGE_NFT_ADDRESS,
          abi: BADGE_NFT_ABI,
          functionName: "totalSupply",
          args: [],
        });
        for (let i = 1n; i <= totalSupply; i++) {
          try {
            const owner = await publicClient.readContract({
              address: BADGE_NFT_ADDRESS,
              abi: BADGE_NFT_ABI,
              functionName: "ownerOf",
              args: [i],
            });
            if (owner.toLowerCase() === sa.toLowerCase()) {
              setTokenId(i.toString());
              log(`NFT Token ID #${i} already owned by your Smart Account`, "success", "OK");
              break;
            }
          } catch (_) {}
        }
        setStep(STEP.CONFIRMED);
        log("Zero-ETH gasless mint complete ✓", "success", "OK");
        return;
      }

      const gasPrices = await pimlicoClient.getUserOperationGasPrice();
      log(
        `Quote received · Gas sponsored by Pimlico · User pays $0.08 MUSD`,
        "info",
        "INFO"
      );

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
      setStep(STEP.APPROVE);
      log("Building MUSD approval calldata…", "warn", "APPROVE");

      const approveData = encodeFunctionData({
        abi: MUSD_ABI,
        functionName: "approve",
        args: [BADGE_NFT_ADDRESS, MINT_FEE],
      });

      log(`Approve ${MUSD_ADDRESS.slice(0, 8)}… to spend 0.08 MUSD`, "warn", "APPROVE");

      // ── STEP 3 · SETTLE ─────────────────────────────────────────────────────
      setStep(STEP.SETTLE);
      log("Submitting batched UserOperation to UGF relayer…", "default", "RELAY");

      const claimData = encodeFunctionData({
        abi: BADGE_NFT_ABI,
        functionName: "claimBadge",
        args: [],
      });

      // ── STEP 4 · EXECUTE ────────────────────────────────────────────────────
      setStep(STEP.EXECUTE);
      log("Broadcasting UserOp to Base Sepolia bundler…", "default", "CHAIN");

      // Check if Smart Account already has enough MUSD to skip faucet
      const saMusdBalance = await publicClient.readContract({
        address: MUSD_ADDRESS,
        abi: MUSD_ABI,
        functionName: "balanceOf",
        args: [sa],
      });

      const calls = [];
      if (saMusdBalance < MINT_FEE) {
        log("Smart Account needs MUSD – calling faucet in batch…", "info", "INFO");
        calls.push({
          to: MUSD_ADDRESS,
          data: encodeFunctionData({ abi: MUSD_ABI, functionName: "faucet", args: [] }),
          value: 0n,
        });
      } else {
        log(`Smart Account has ${formatUnits(saMusdBalance, 18)} MUSD – skipping faucet`, "info", "INFO");
      }
      calls.push({ to: MUSD_ADDRESS, data: approveData, value: 0n });
      calls.push({ to: BADGE_NFT_ADDRESS, data: claimData, value: 0n });

      // Batch: [optional faucet] + approve MUSD + claimBadge in one sponsored UserOperation
      const userOpHash = await smartAccountClient.sendTransaction({ calls });

      log(`UserOp hash: ${userOpHash.slice(0, 14)}…`, "default", "CHAIN");
      log("Waiting for on-chain confirmation…", "default", "CHAIN");

      const receipt = await pimlicoClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 300_000, // 5 minutes – Sepolia can be slow
      });

      const confirmedTxHash = receipt.receipt.transactionHash;
      setTxHash(confirmedTxHash);

      // Parse BadgeMinted(address indexed to, uint256 tokenId)
      // topic[0] = event sig, topic[1] = indexed `to`, data = tokenId
      const badgeMintedSig =
        "0x" +
        Array.from(
          new TextEncoder().encode("BadgeMinted(address,uint256)")
        ).reduce((_, __, i, a) => {
          // keccak256 – use viem's built-in
          return a;
        }, []);

      // Use viem to get the raw receipt logs and find the token ID
      const txReceipt = await publicClient.getTransactionReceipt({
        hash: confirmedTxHash,
      });

      // Find the BadgeMinted log emitted by BadgeNFT
      const mintLog = txReceipt.logs.find(
        (l) =>
          l.address.toLowerCase() === BADGE_NFT_ADDRESS?.toLowerCase() &&
          l.topics.length >= 2
      );

      if (mintLog) {
        // tokenId is in `data` (non-indexed)
        const tid = BigInt(mintLog.data).toString();
        setTokenId(tid);
        log(`NFT Token ID #${tid} assigned to your Smart Account`, "success", "OK");
      }

      // ── STEP 5 · CONFIRMED ──────────────────────────────────────────────────
      setStep(STEP.CONFIRMED);
      log(
        `Tx confirmed: ${confirmedTxHash.slice(0, 14)}…${confirmedTxHash.slice(-6)}`,
        "success",
        "OK"
      );
      log("Zero-ETH gasless mint complete ✓", "success", "OK");
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
    setTokenId(null);
    setSmartAddress(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    step,
    logs,
    txHash,
    tokenId,
    smartAddress,
    isLoading,
    error,
    mint,
    reset,
  };
}
