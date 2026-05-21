import { useState, useEffect } from "react";
import WalletConnect from "./WalletConnect.jsx";
import { useWallet } from "../hooks/useWallet.js";
import { useUGFSwap, SWAP_STEP } from "../hooks/useUGFSwap.js";

export default function SwapPanel({ onStepChange, onLogsChange }) {
  const {
    isConnected,
    isCorrectChain,
    musdBalance,
    refetchBalance,
  } = useWallet();

  const {
    step,
    logs,
    txHash,
    isLoading,
    error,
    prices,
    lastUpdated,
    priceError,
    swap,
    reset,
  } = useUGFSwap();

  const [amountIn, setAmountIn] = useState("10");
  const [targetToken, setTargetToken] = useState("solana");
  const [targetChain, setTargetChain] = useState("Solana");

  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (onLogsChange) onLogsChange(logs);
  }, [logs, onLogsChange]);

  useEffect(() => {
    if (step === SWAP_STEP.CONFIRMED) {
      refetchBalance();
    }
  }, [step, refetchBalance]);

  const isConfirmed = step === SWAP_STEP.CONFIRMED;
  const musdDisplay = musdBalance !== null ? parseFloat(musdBalance).toFixed(2) : "–";
  const hasEnoughMUSD = musdBalance !== null && parseFloat(musdBalance) >= parseFloat(amountIn || "0");

  // Calculate output amount based on CoinGecko prices
  const outPrice = prices[targetToken] || 0;
  const estimatedOutput = outPrice > 0 && amountIn ? (parseFloat(amountIn) / outPrice).toFixed(6) : "0.000000";

  const handleSwap = () => {
    swap(amountIn, targetToken.toUpperCase(), targetChain);
  };

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-blue-400">Universal Swapper</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Gasless Cross-Chain Liquidity</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-900/60 text-blue-400">
          Powered by Li.Fi
        </span>
      </div>

      {/* Live Oracle Accountability Signal */}
      <div className="mb-4 flex items-center justify-between px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            {!priceError && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${priceError ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
          </div>
          <span className="text-[10px] font-medium text-slate-300">Live Price Oracle</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          {priceError ? (
            <span className="text-yellow-500">{priceError}</span>
          ) : lastUpdated ? (
            `Updated: ${lastUpdated.toLocaleTimeString()}`
          ) : (
            "Syncing..."
          )}
        </div>
      </div>

      <div className="mb-4">
        <WalletConnect />
      </div>

      {isConnected && isCorrectChain && (
        <>
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800/60 p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">From</span>
              <span className="text-xs text-slate-500">Balance: {musdDisplay}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                placeholder="0.0"
                disabled={isLoading || isConfirmed}
              />
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md shrink-0">
                <span className="text-green-400 text-lg">💵</span>
                <span className="font-bold">MUSD</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 ml-1">Base Sepolia</div>
          </div>

          <div className="flex justify-center -my-6 relative z-10">
            <div className="w-8 h-8 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-blue-400 text-sm shadow-xl">
              &darr;
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800/60 p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">To (Estimated)</span>
              {outPrice > 0 && <span className="text-xs text-slate-500">1 {targetToken.toUpperCase()} = ${outPrice.toLocaleString()}</span>}
            </div>
            <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
              <input
                type="text"
                value={estimatedOutput}
                readOnly
                className="bg-transparent text-2xl font-bold text-white outline-none w-full"
              />
              <select
                value={targetToken}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetToken(val);
                  // Map coingecko id to a clean Chain name for UI
                  const chainMap = {
                    bitcoin: "Bitcoin",
                    ethereum: "Arbitrum",
                    solana: "Solana",
                    ripple: "XRP Ledger",
                    binancecoin: "BNB Chain",
                    cardano: "Cardano",
                    dogecoin: "Dogecoin",
                    tron: "Tron",
                    "the-open-network": "TON",
                    chainlink: "Ethereum",
                    "avalanche-2": "Avalanche",
                    polkadot: "Polkadot",
                    "polygon-ecosystem-token": "Polygon",
                    litecoin: "Litecoin",
                    "shiba-inu": "Ethereum",
                    "bitcoin-cash": "Bitcoin Cash",
                    uniswap: "Ethereum",
                    stellar: "Stellar",
                    monero: "Monero",
                    cosmos: "Cosmos"
                  };
                  setTargetChain(chainMap[val] || "Unknown");
                }}
                disabled={isLoading || isConfirmed}
                className="bg-slate-800 px-2 py-1.5 rounded-md shrink-0 text-white font-bold outline-none cursor-pointer border border-slate-700 max-w-[140px] truncate"
              >
                <option value="bitcoin">BTC (Bitcoin)</option>
                <option value="ethereum">ETH (Ethereum/L2s)</option>
                <option value="solana">SOL (Solana)</option>
                <option value="ripple">XRP (Ripple)</option>
                <option value="binancecoin">BNB (BNB Chain)</option>
                <option value="cardano">ADA (Cardano)</option>
                <option value="dogecoin">DOGE (Dogecoin)</option>
                <option value="tron">TRX (Tron)</option>
                <option value="the-open-network">TON (Toncoin)</option>
                <option value="chainlink">LINK (Chainlink)</option>
                <option value="avalanche-2">AVAX (Avalanche)</option>
                <option value="polkadot">DOT (Polkadot)</option>
                <option value="polygon-ecosystem-token">POL (Polygon)</option>
                <option value="litecoin">LTC (Litecoin)</option>
                <option value="shiba-inu">SHIB (Shiba Inu)</option>
                <option value="bitcoin-cash">BCH (Bitcoin Cash)</option>
                <option value="uniswap">UNI (Uniswap)</option>
                <option value="stellar">XLM (Stellar)</option>
                <option value="monero">XMR (Monero)</option>
                <option value="cosmos">ATOM (Cosmos)</option>
              </select>
            </div>
            <div className="flex items-center justify-between mt-1.5 ml-1">
              <div className="text-[10px] text-slate-500">Destination: <span className="text-blue-400 font-semibold">{targetChain}</span></div>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-950/20 p-2.5">
              <p className="text-xs text-red-400 font-mono break-all">[ERROR] {error}</p>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Network Fee</span>
              <span className="text-xs font-semibold text-green-400 strike line-through opacity-60 mr-1">0.005 ETH</span>
              <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-0.5 rounded text-[10px]">Sponsored by UGF SDK</span>
            </div>
            
            {isConfirmed ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                  <p className="text-sm text-blue-300 font-bold mb-1">✓ Swap Initiated</p>
                  <p className="text-xs text-slate-400">Your {amountIn} MUSD has been locked on Base. You will receive {estimatedOutput} {targetToken.toUpperCase()} on {targetChain} shortly.</p>
                  <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 underline mt-2 inline-block">
                    View Transaction
                  </a>
                </div>
                <button
                  onClick={reset}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Start New Swap
                </button>
              </div>
            ) : (
              <button
                onClick={handleSwap}
                disabled={isLoading || !hasEnoughMUSD || !amountIn || parseFloat(amountIn) <= 0}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300
                  ${isLoading || !hasEnoughMUSD || !amountIn || parseFloat(amountIn) <= 0
                    ? "bg-blue-900/30 text-blue-400 border border-blue-500/40 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-400 text-black cursor-pointer glow-blue hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin-slow" />
                    Bridging…
                  </span>
                ) : !hasEnoughMUSD ? (
                  "Insufficient MUSD Balance"
                ) : (
                  "Swap Cross-Chain (Gasless)"
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
          <p className="text-slate-600 text-xs text-center italic">Connect your wallet to start swapping</p>
        </div>
      )}
    </div>
  );
}
