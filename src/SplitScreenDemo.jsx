import { useState } from "react";
import LeftPanel from "./components/LeftPanel.jsx";
import RightPanel from "./components/RightPanel.jsx";
import SwapPanel from "./components/SwapPanel.jsx";
import EngineLog from "./components/EngineLog.jsx";

/**
 * Root demo layout – three-column split screen.
 * RightPanel owns UGF state and bubbles step/logs up to EngineLog.
 */
export default function SplitScreenDemo() {
  const [activeTab, setActiveTab] = useState("mint"); // 'mint' or 'swap'
  
  // Mint log state
  const [mintStep, setMintStep] = useState(0);
  const [mintLogs, setMintLogs] = useState([]);

  // Swap log state
  const [swapStep, setSwapStep] = useState(0);
  const [swapLogs, setSwapLogs] = useState([]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "radial-gradient(ellipse at 20% 0%, #0a1f0d 0%, #050b12 55%)" }}
    >
      {/* ── top bar ── */}
      <header className="border-b border-slate-800/80 glass px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            ⛽
          </div>
          <div>
            <span className="text-sm font-bold text-white">Universal Gas Framework</span>
            <span className="ml-2 text-[10px] text-green-400 font-semibold uppercase tracking-wider">
              Live Demo
            </span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => handleTabChange("mint")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "mint"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Badge Minter
          </button>
          <button
            onClick={() => handleTabChange("swap")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "swap"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Universal Swap
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-slate-400">Base Sepolia</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-900/50 text-blue-300">
            Hackathon 2025
          </span>
        </div>
      </header>

      {/* ── hero ── */}
      <div className="text-center py-5 shrink-0">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="text-slate-400">From Clunky </span>
          <span className="text-red-400">{activeTab === "mint" ? "ETH gas hell" : "Bridging Nightmare"}</span>
          <span className="text-slate-400"> → </span>
          <span className="shimmer-text">Invisible Web2-like UX</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {activeTab === "mint" 
            ? "Real Remote gasless transactions on Base Sepolia · Powered by UGF SDK"
            : "Gasless Cross-Chain Swaps · Real-time Oracles · Zero native gas required"}
        </p>
      </div>

      {/* ── 3-col layout ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr_1px_340px] gap-0 px-4 pb-4 min-h-0">
        {/* Left */}
        <div className="glass rounded-2xl border border-red-900/30 p-5 lg:rounded-r-none lg:border-r-0 m-1 min-h-0">
          <div className={activeTab === "mint" ? "h-full" : "hidden"}>
            <LeftPanel />
          </div>
          <div className={activeTab === "swap" ? "flex flex-col items-center justify-center h-full text-center" : "hidden"}>
            <span className="text-4xl mb-4">🌉</span>
            <h3 className="text-red-400 font-bold mb-2">The Old Way: Bridging</h3>
            <p className="text-xs text-slate-400 max-w-xs">Buy ETH &rarr; Bridge to Arbitrum &rarr; Wait 15 mins &rarr; Buy ARB Gas &rarr; Swap on DEX.</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center my-8">
          <div className="w-px h-full bg-slate-700/50" />
        </div>

        {/* Right – real chain */}
        <div className="glass rounded-2xl border border-green-900/30 p-5 lg:rounded-l-none lg:border-l-0 m-1 min-h-0">
          <div className={activeTab === "mint" ? "h-full" : "hidden"}>
            <RightPanel onStepChange={setMintStep} onLogsChange={setMintLogs} />
          </div>
          <div className={activeTab === "swap" ? "h-full" : "hidden"}>
            <SwapPanel onStepChange={setSwapStep} onLogsChange={setSwapLogs} />
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center my-8">
          <div className="w-px h-full bg-slate-700/40" />
        </div>

        {/* Engine log */}
        <div className="glass rounded-2xl border border-slate-700/50 p-5 m-1 min-h-[320px] lg:min-h-0">
          <EngineLog
            step={activeTab === "mint" ? mintStep : swapStep}
            logs={activeTab === "mint" ? mintLogs : swapLogs}
          />
        </div>
      </div>

      {/* ── footer ── */}
      <footer className="border-t border-slate-800/80 glass px-6 py-2 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
        <span>UGF SDK · Remote Execution Nodes · Base Sepolia</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-green-500" />
          Relayer online
        </span>
      </footer>
    </div>
  );
}
