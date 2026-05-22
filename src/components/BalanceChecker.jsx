import { useState, useCallback } from "react";
import { createPublicClient, http, formatEther, formatUnits, isAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { MUSD_ABI, UGF_MUSD_ADDRESS } from "../config/contracts.js";

// Read-only public client — no wallet needed
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
});

export default function BalanceChecker() {
  const [inputAddress, setInputAddress] = useState("");
  const [result, setResult] = useState(null); // { eth, musd } | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkBalance = useCallback(async () => {
    const trimmed = inputAddress.trim();
    if (!isAddress(trimmed)) {
      setError("Invalid address — must be a valid 0x… Ethereum address.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [ethRaw, musdRaw] = await Promise.all([
        publicClient.getBalance({ address: trimmed }),
        publicClient.readContract({
          address: UGF_MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "balanceOf",
          args: [trimmed],
        }),
      ]);

      setResult({
        eth: Number(formatEther(ethRaw)).toFixed(4),
        musd: Number(formatUnits(musdRaw, 6)).toFixed(2),
      });
    } catch (err) {
      setError("RPC error — could not fetch balances. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inputAddress]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") checkBalance();
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          🔍 Balance Checker
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/30 font-semibold">
          No Wallet Needed
        </span>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          id="balance-checker-input"
          type="text"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0x… any address"
          className="flex-1 min-w-0 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-green-500/60 transition-colors"
        />
        <button
          id="balance-checker-btn"
          onClick={checkBalance}
          disabled={loading}
          className="shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-green-400/40 border-t-green-400 rounded-full animate-spin" />
              …
            </span>
          ) : (
            "Check"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-[10px] text-red-400 font-mono">{error}</p>
      )}

      {/* Results */}
      {result && (
        <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
          {/* ETH */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5 text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">ETH Balance</p>
            <p className="text-sm font-bold text-blue-300 font-mono">{result.eth}</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Base Sepolia ETH</p>
          </div>
          {/* MUSD */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5 text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">MUSD Balance</p>
            <p className={`text-sm font-bold font-mono ${parseFloat(result.musd) >= 0.08 ? "text-green-400" : "text-yellow-400"}`}>
              ${result.musd}
            </p>
            <p className="text-[9px] text-slate-600 mt-0.5">Mock USD (TYI)</p>
          </div>
        </div>
      )}

      {/* Hint */}
      {!result && !error && !loading && (
        <p className="mt-2 text-[9px] text-slate-600">
          Reads live on-chain data via Base Sepolia public RPC — no sign-in required.
        </p>
      )}
    </div>
  );
}
