import { useRef, useEffect } from "react";
import { STEP } from "../hooks/useUGFMint.js";

const STEPS_DEF = [
  { id: STEP.IDLE,      label: "Idle",             color: "text-slate-400" },
  { id: STEP.QUOTE,     label: "Quote",            color: "text-blue-400"  },
  { id: STEP.APPROVE,   label: "Approve MUSD",     color: "text-yellow-400"},
  { id: STEP.SETTLE,    label: "Settle",           color: "text-purple-400"},
  { id: STEP.EXECUTE,   label: "Execute On-chain", color: "text-orange-400"},
  { id: STEP.CONFIRMED, label: "Confirmed ✓",      color: "text-green-400" },
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
 * Driven by `step` (0-5) and `logs` array from useUGFMint.
 */
export default function EngineLog({ step, logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const progress = Math.round((Math.min(step, 5) / 5) * 100);

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
        {STEPS_DEF.map((s) => {
          const isActive = s.id === step;
          const isDone   = s.id < step || (s.id === STEP.CONFIRMED && step === STEP.CONFIRMED);
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-300
                ${isActive ? "bg-green-950/40 border border-green-500/30" : "border border-transparent"}`}
            >
              <StepDot isActive={isActive} isDone={isDone} />
              <span className={`text-xs font-semibold transition-colors duration-300
                ${isDone ? "text-green-400" : isActive ? "text-green-300" : "text-slate-600"}`}>
                {s.label}
              </span>
              {isActive  && <span className="ml-auto text-[10px] text-green-400/70 animate-pulse">running</span>}
              {isDone && s.id !== STEP.CONFIRMED && <span className="ml-auto text-[10px] text-green-600">✓</span>}
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
            Click "Mint Badge" to start the UGF engine
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

      {step === STEP.CONFIRMED && (
        <div className="mt-3 rounded-lg border border-green-500/30 bg-green-950/30 p-2.5 text-center animate-slide-in-up">
          <p className="text-green-400 font-bold text-xs">🎉 Zero-ETH transaction complete</p>
          <p className="text-green-600 text-[10px] mt-0.5">
            Paid $0.08 MUSD · Gas sponsored by Pimlico paymaster
          </p>
        </div>
      )}
    </div>
  );
}
