import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import WalletConnect from "./WalletConnect.jsx";
import NFTPreview from "./NFTPreview.jsx";
import { useWallet } from "../hooks/useWallet.js";
import { useUGFMint, STEP } from "../hooks/useUGFMint.js";
import { MUSD_ABI } from "../config/contracts.js";
import { NFT_CATALOG, DEFAULT_NFT } from "../config/nftCatalog.js";
import { parseUnits, formatUnits } from "viem";
import { useState, useEffect } from "react";

/**
 * Right panel – real UGF flow wired to UGF network with Multi-NFT tier selection.
 */
export default function RightPanel({ onStepChange, onLogsChange, onNavigate }) {
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

  const [selectedNFT, setSelectedNFT] = useState(DEFAULT_NFT);

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
  const requiredAmount = selectedNFT?.priceMUSD ?? 0.08;
  const hasMusd = musdBalance !== null && parseFloat(musdBalance) >= requiredAmount;

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-green-300">With UGF</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Universal Gas Framework</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-900/60 text-green-400">
          The Solution
        </span>
      </div>

      {/* wallet connect */}
      <div className="mb-3">
        <WalletConnect />
      </div>

      {isConnected && isCorrectChain && (
        <>
          {/* balance card */}
          <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800/60 p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Your Balance</span>
              <span className={`text-sm font-bold font-mono ${hasMusd ? "text-green-400" : "text-red-400"}`}>
                ${musdDisplay} MUSD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Network</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-semibold">Base Sepolia</span>
              </div>
            </div>
          </div>

          {/* NFT Tier Selector */}
          {!isConfirmed && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Select NFT Tier
                </span>
                <span className="text-[10px] text-slate-500">Pick edition</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {NFT_CATALOG.map((item) => {
                  const isSelected = selectedNFT?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedNFT(item)}
                      className={`p-2 rounded-xl text-left transition-all border flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "border-green-400 bg-green-950/40 ring-1 ring-green-400/40 scale-[1.02]"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-green-400">{item.priceDisplay} MUSD</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* faucet – only show if low MUSD */}
          {!hasMusd && !isConfirmed && (
            <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-2.5">
              <p className="text-[10px] text-yellow-300 mb-1.5">
                ⚠ You need at least ${requiredAmount.toFixed(2)} MUSD to mint this tier.
              </p>
              <a
                href="https://universalgasframework.com/faucets"
                target="_blank"
                rel="noreferrer"
                className="block text-center w-full py-1.5 rounded-lg text-[11px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all"
              >
                🪙 Get Free MUSD from Official Faucet ↗
              </a>
            </div>
          )}

          {/* NFT preview or selected badge summary */}
          {isConfirmed ? (
            <div className="space-y-3">
              <NFTPreview txHash={txHash} tokenId={tokenId} smartAddress={smartAddress} />
              {onNavigate && (
                <button
                  onClick={() => onNavigate("my-nfts")}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-black cursor-pointer shadow-lg shadow-purple-500/20 transition-all"
                >
                  View in "My Minted NFTs" & Sell at Auction →
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-2.5 mb-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{selectedNFT?.name}</p>
                <p className="text-[10px] text-slate-500">ERC-721 · Base Sepolia · Gasless Execution</p>
              </div>
              <span className="text-xs font-bold font-mono text-green-400">{selectedNFT?.priceDisplay}</span>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-950/20 p-2.5">
              <p className="text-xs text-red-400 font-mono break-all">[ERROR] {error}</p>
            </div>
          )}

          {/* mint / reset button */}
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Gas Required</span>
              <span className="text-[10px] font-semibold text-green-400">0 ETH (Sponsored via UGF)</span>
            </div>
            {isConfirmed ? (
              <button
                id="reset-btn"
                onClick={reset}
                className="w-full py-3 rounded-xl text-xs font-bold bg-green-900/40 text-green-400 border border-green-500/50 cursor-pointer hover:bg-green-900/60 transition-all"
              >
                ✓ Minted Successfully · Mint Another Tier?
              </button>
            ) : (
              <button
                id="mint-btn"
                onClick={() => mint(selectedNFT)}
                disabled={isLoading || !hasMusd}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-300 relative overflow-hidden
                  ${isLoading || !hasMusd
                    ? "bg-green-900/30 text-green-400 border border-green-500/40 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-400 text-black cursor-pointer glow-green hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin-slow" />
                    Processing Gasless Mint…
                  </span>
                ) : (
                  `Mint ${selectedNFT?.name} · Pay ${selectedNFT?.priceDisplay} USD (0 ETH)`
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
