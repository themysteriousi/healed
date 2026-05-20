import { useConnect, useDisconnect } from "wagmi";
import { useWallet } from "../hooks/useWallet.js";

/**
 * Compact wallet connect bar.
 * Shows connect button when disconnected, address + chain status when connected.
 */
export default function WalletConnect() {
  const { connectors, connect, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    address,
    shortAddress,
    isConnected,
    isCorrectChain,
    isSwitching,
    ethBalanceFormatted,
    switchToSepolia,
  } = useWallet();

  if (!isConnected) {
    return (
      <div className="space-y-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-400 active:scale-95 text-black transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Connecting…" : `🦊 Connect ${connector.name}`}
          </button>
        ))}
        {connectError && (
          <div className="text-[10px] text-red-400 text-center font-mono break-all mt-2 p-1 bg-red-950/30 rounded border border-red-500/20">
            {connectError.message || connectError.toString()}
          </div>
        )}
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-300">
          ⚠ Wrong network – please switch to Sepolia
        </div>
        <button
          id="switch-chain-btn"
          onClick={switchToSepolia}
          disabled={isSwitching}
          className="w-full py-2 rounded-xl text-sm font-bold bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : "Switch to Sepolia"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-slate-800/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
        <span className="text-xs font-mono text-slate-300">{shortAddress}</span>
        <span className="text-[10px] text-slate-500">· {ethBalanceFormatted} ETH</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-green-400 font-semibold">Sepolia</span>
        <button
          id="wallet-disconnect-btn"
          onClick={() => disconnect()}
          className="text-[10px] text-slate-600 hover:text-slate-300 ml-1 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
