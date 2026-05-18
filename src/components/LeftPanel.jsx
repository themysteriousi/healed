/**
 * LeftPanel – purely visual storytelling (unchanged from original demo).
 * Shows the "Without UGF" friction: MetaMask popup, gas error, disabled button.
 */
function Badge({ children, color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {children}
    </span>
  );
}

function MetaMaskPopup() {
  return (
    <div className="rounded-xl border border-orange-500/40 bg-[#1a1200] p-4 shadow-lg animate-float">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-xs font-bold text-black">🦊</div>
        <span className="text-xs font-semibold text-orange-300 uppercase tracking-widest">MetaMask</span>
        <Badge color="bg-orange-900 text-orange-300">Network Switch</Badge>
      </div>
      <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
        This site wants to switch to{" "}
        <span className="font-bold text-orange-300">Base Sepolia Testnet</span>.
        Make sure you trust this site before switching.
      </p>
      <div className="flex gap-2">
        <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed">
          Reject
        </button>
        <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/50 cursor-not-allowed">
          Switch Network
        </button>
      </div>
    </div>
  );
}

export default function LeftPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-200">Without UGF</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Traditional Web3 UX</p>
        </div>
        <Badge color="bg-red-900/60 text-red-400">The Problem</Badge>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-orange-500" />
          <span className="text-xs text-slate-400 font-mono">0x7F3a…9dC2</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-red-400 font-bold">0.000 ETH</p>
          <p className="text-[10px] text-slate-500">Base Sepolia</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">① MetaMask Interruption</p>
        <MetaMaskPopup />
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">② Gas Error</p>
        <div className="rounded-xl border border-red-500/50 bg-red-950/30 p-3 glow-red">
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-lg leading-none">⚠</span>
            <div>
              <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-0.5">Transaction Failed</p>
              <p className="text-red-300 text-xs leading-relaxed">
                Insufficient ETH for gas fee.<br />
                <span className="text-slate-400">Required: 0.003 ETH · Balance: 0.000 ETH</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">③ Blocked Action</p>
        <button disabled className="w-full py-3 rounded-xl text-sm font-bold bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600">
          Mint Badge
        </button>
        <p className="text-center text-[10px] text-red-400/70 mt-1">
          ✕ Requires ETH for gas · Top-up wallet to continue
        </p>
      </div>
    </div>
  );
}
