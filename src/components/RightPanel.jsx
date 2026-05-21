import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import WalletConnect from "./WalletConnect.jsx";
import NFTPreview from "./NFTPreview.jsx";
import { useWallet } from "../hooks/useWallet.js";
import { useUGFMint, STEP } from "../hooks/useUGFMint.js";
import { MUSD_ABI } from "../config/contracts.js";
import { parseUnits, formatUnits } from "viem";
import { useState, useEffect } from "react";

/**
 * Right panel – real UGF flow wired to Pimlico ERC-4337.
 */
export default function RightPanel({ onStepChange, onLogsChange }) {
  const {
    address,
    isConnected,
    isCorrectChain,
    musdBalance,
    hasClaimed,
    refetchBalance,
    refetchClaimed,
    handleFaucet,
    faucetTxHash,
  } = useWallet();

  const {
    step,
    logs,
    txHash,
    tokenId,
    smartAddress,
    isLoading,
    error,
    mint,
    reset,
  } = useUGFMint();

  // Bubble state up so SplitScreenDemo can pass to EngineLog
  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (onLogsChange) onLogsChange(logs);
  }, [logs, onLogsChange]);

  // ── Faucet (get test MUSD) ───────────────────────────────────────────────
  const { isLoading: isFaucetConfirming, isSuccess: isFaucetSuccess } = useWaitForTransactionReceipt({
    hash: faucetTxHash,
  });

  useEffect(() => {
    if (isFaucetSuccess) {
      refetchBalance();
    }
  }, [isFaucetSuccess, refetchBalance]);

  useEffect(() => {
    if (step === STEP.CONFIRMED) {
      refetchBalance();
      refetchClaimed();
    }
  }, [step, refetchBalance, refetchClaimed]);

  const isConfirmed = step === STEP.CONFIRMED;
  const musdDisplay = musdBalance !== null ? parseFloat(musdBalance).toFixed(2) : "–";
  const hasMusd = musdBalance !== null && parseFloat(musdBalance) >= 0.08;

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-green-300">With UGF</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Universal Gas Framework</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-900/60 text-green-400">
          The Solution
        </span>
      </div>

      {/* wallet connect */}
      <div className="mb-4">
        <WalletConnect />
      </div>

      {isConnected && isCorrectChain && (
        <>
          {/* balance card */}
          <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800/60 p-4 mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Your Wallet</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Mock USD Balance</span>
              <span className={`text-sm font-bold ${hasMusd ? "text-green-400" : "text-red-400"}`}>
                ${musdDisplay}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">Badge</span>
              <span className="text-xs font-semibold text-blue-300">Hackathon 2025 – Finisher</span>
            </div>
            <div className="h-px bg-slate-700/60 mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Network</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-semibold">Base Sepolia</span>
              </div>
            </div>
          </div>

          {/* faucet – only show if low MUSD */}
          {!hasMusd && !isConfirmed && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-3">
              <p className="text-[11px] text-yellow-300 mb-2">
                ⚠ You need at least $0.08 MUSD to mint. Since you have 0 ETH, you must use the official Web2 faucet:
              </p>
              <a
                href="https://universalgasframework.com/faucets"
                target="_blank"
                rel="noreferrer"
                className="block text-center w-full py-2 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all"
              >
                🪙 Get Free MUSD from Official Faucet ↗
              </a>
            </div>
          )}

          {/* NFT preview or badge card */}
          {isConfirmed ? (
            <NFTPreview txHash={txHash} tokenId={tokenId} smartAddress={smartAddress} />
          ) : (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 mb-4 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 opacity-60"
                style={{
                  background: "linear-gradient(135deg, #0f2a1a 0%, #134d2e 100%)",
                  border: "1.5px solid rgba(74,222,128,0.4)",
                }}
              >
                🏷️
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Hackathon 2025 – Finisher</p>
                <p className="text-[10px] text-slate-500 mt-0.5">ERC-721 · Base Sepolia · Token ID TBD</p>
                {hasClaimed && (
                  <span className="text-[10px] text-yellow-400">Already claimed by this wallet</span>
                )}
              </div>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-950/20 p-2.5">
              <p className="text-xs text-red-400 font-mono break-all">[ERROR] {error}</p>
            </div>
          )}

          {/* mint / reset button */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Gas fee</span>
              <span className="text-[10px] font-semibold text-green-400">$0.08 MUSD · 0 ETH</span>
            </div>
            {isConfirmed ? (
              <button
                id="reset-btn"
                onClick={reset}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-green-900/40 text-green-400 border border-green-500/50 cursor-pointer hover:bg-green-900/60 transition-all"
              >
                ✓ Badge Minted Successfully · Mint Another?
              </button>
            ) : hasClaimed ? (
              <button disabled className="w-full py-3.5 rounded-xl text-sm font-bold bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600">
                Badge Already Claimed
              </button>
            ) : (
              <button
                id="mint-btn"
                onClick={mint}
                disabled={isLoading || !hasMusd}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                  ${isLoading || !hasMusd
                    ? "bg-green-900/30 text-green-400 border border-green-500/40 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-400 text-black cursor-pointer glow-green hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin-slow" />
                    Processing…
                  </span>
                ) : (
                  "Mint Badge · Pay $0.08 USD"
                )}
              </button>
            )}
          </div>
        </>
      )}

      {isConnected && !isCorrectChain && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm text-center">Switch to Base Sepolia to continue</p>
        </div>
      )}

      {!isConnected && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600 text-xs text-center italic">Connect your wallet to start minting</p>
        </div>
      )}
    </div>
  );
}
