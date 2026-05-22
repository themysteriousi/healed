import { useRef, useEffect } from "react";
import BalanceChecker from "./BalanceChecker.jsx";

const MINT_STEPS = [
  { id: 0, label: "Idle",             color: "text-slate-400" },
  { id: 1, label: "Quote",            color: "text-blue-400"  },
  { id: 2, label: "Approve MUSD",     color: "text-yellow-400"},
  { id: 3, label: "Execute On-chain", color: "text-orange-400"},
  { id: 4, label: "Confirmed ✓",      color: "text-green-400" },
];

const SWAP_STEPS = [
  { id: 0, label: "Idle",             color: "text-slate-400" },
  { id: 1, label: "Quote",            color: "text-blue-400"  },
  { id: 2, label: "Approve MUSD",     color: "text-yellow-400"},
  { id: 3, label: "Bridge / Settle",  color: "text-purple-400"},
  { id: 4, label: "Execute On-chain", color: "text-orange-400"},
  { id: 5, label: "Confirmed ✓",      color: "text-green-400" },
];

const LOG_COLORS = {
  info:    "text-blue-300",
  warn:    "text-yellow-300",
  success: "text-green-400",
  error:   "text-red-400",
  default: "text-slate-400",
};

function StepDot({ isActive, isDone }) {
  const base = "w-2.5 h-2.5 rounded-full border transition-all duration-300 shrink-0";
  if (isDone)   return <div className={`${base} bg-green-400 border-green-400`} />;
  if (isActive) return <div className={`${base} bg-transparent border-green-400 animate-pulse`} />;
  return <div className={`${base} bg-transparent border-slate-700`} />;
}

/**
 * Real-time UGF engine log panel.
 * Driven by `step` and `logs` array.
 */
export default function EngineLog({ step, logs, activeTab }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const steps = activeTab === "swap" ? SWAP_STEPS : MINT_STEPS;
  const maxStep = steps.length - 1;
  const progress = Math.round((Math.min(step, maxStep) / maxStep) * 100);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* title bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-bold text-green-300 uppercase tracking-widest">
          UGF Engine Log
        </span>
        <span className="ml-auto text-[10px] text-slate-600 font-mono">
          ugf · SDK
        </span>
      </div>

      {/* step pipeline */}
      <div className="space-y-1 mb-4">
        {steps.map((s) => {
          const isActive = s.id === step;
          const isDone   = s.id < step || (s.id === maxStep && step === maxStep);
          return (
            <div key={s.id} className="flex flex-col mb-1">
              <div
                className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-300
                  ${isActive ? "bg-green-950/40 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]" : "border border-transparent"}`}
              >
                <StepDot isActive={isActive} isDone={isDone} />
                <span className={`text-xs font-semibold transition-colors duration-300
                  ${isDone ? "text-green-400" : isActive ? "text-green-300" : "text-slate-600"}`}>
                  {s.label}
                </span>
                {isActive  && <span className="ml-auto text-[10px] text-green-400/70 animate-pulse">running</span>}
                {isDone && s.id !== maxStep && <span className="ml-auto text-[10px] text-green-600">✓</span>}
              </div>

              {/* Dynamic visualization blocks for active steps */}
              {isActive && s.label === "Approve MUSD" && (
                <div className="ml-5 mt-1 mb-2 p-2 rounded-lg border border-yellow-500/40 bg-gradient-to-r from-yellow-900/30 to-transparent flex items-start gap-2 animate-pulse">
                  <span className="text-base mt-0.5">💳</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide">Signing Payment Intent</span>
                    <span className="text-[9px] text-yellow-200/70">Authorizing 0.08 MUSD off-chain payment. No gas required.</span>
                  </div>
                </div>
              )}

              {isActive && s.label === "Execute On-chain" && (
                <div className="ml-5 mt-1 mb-2 p-2.5 rounded-lg border border-orange-500/50 bg-gradient-to-r from-orange-900/40 to-transparent flex items-start gap-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 animate-pulse" />
                  <span className="text-lg mt-0.5 animate-bounce">⛽</span>
                  <div className="flex flex-col relative z-10">
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">Injecting Sponsored Gas</span>
                    <span className="text-[9px] text-orange-200">UGF Relayers are pre-funding your wallet with ETH to cover the native network fee...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* scrollable log */}
      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-0.5 min-h-0">
        {logs.length === 0 && (
          <p className="text-slate-600 italic px-1">
            {activeTab === "swap" ? 'Select asset and click "Swap Cross-Chain" to start the UGF engine' : 'Click "Mint Badge" to start the UGF engine'}
            <span className="animate-blink">_</span>
          </p>
        )}
        {logs.map((entry, i) => (
          <div key={i} className={`flex gap-2 px-1 py-0.5 rounded log-entry ${LOG_COLORS[entry.type] ?? "text-slate-400"}`}>
            <span className="text-slate-600 shrink-0">{entry.time}</span>
            <span className="text-slate-500 shrink-0">[{entry.level}]</span>
            <span className="break-all">{entry.msg}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {step === maxStep && (
        <div className="mt-3 rounded-xl border border-green-400/50 bg-gradient-to-br from-green-900/40 to-slate-900/60 p-3 text-center animate-slide-in-up relative overflow-hidden shadow-[0_0_20px_rgba(74,222,128,0.15)]">
          <div className="absolute inset-0 bg-green-400/5 shimmer-overlay" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xs font-black text-green-300 uppercase tracking-widest">Transaction Successful</span>
            
            <div className="w-full mt-2 grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700/50">
                <span className="block text-[9px] text-slate-500 uppercase">You Paid</span>
                <span className="block text-xs font-bold text-yellow-400">$0.08 MUSD</span>
              </div>
              <div className="bg-green-950/30 rounded-lg p-2 border border-green-500/30">
                <span className="block text-[9px] text-green-500/70 uppercase">Native Gas Cost</span>
                <span className="block text-xs font-bold text-green-400">0 ETH (Sponsored)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance checker — no MetaMask needed */}
      <BalanceChecker />
    </div>
  );
}
