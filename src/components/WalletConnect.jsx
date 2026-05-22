import { useConnect, useDisconnect } from "wagmi";
import { useWallet } from "../hooks/useWallet.js";

/**
 * Compact wallet connect bar.
 * Shows native connect buttons when disconnected, address + chain status when connected.
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
    // Deduplicate connectors by name to prevent overlaps and remove redundant MetaMask button
    const uniqueConnectors = connectors
      .filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
      .filter(c => !c.name.toLowerCase().includes('metamask') && c.id !== 'metaMask');

    return (
      <div className="space-y-2">
        {uniqueConnectors.map((connector) => {
          const isCB = connector.name.toLowerCase().includes('coinbase');
          const isWC = connector.name.toLowerCase().includes('walletconnect');
          const isInjected = connector.name.toLowerCase().includes('injected') || connector.name.toLowerCase().includes('all');
          
          let bgColor = 'bg-slate-700 hover:bg-slate-600 text-white';
          let icon = '🔌';
          let label = connector.name;
          
          if (isCB) { bgColor = 'bg-blue-600 hover:bg-blue-500 text-white'; icon = '🔵'; label = 'Coinbase Wallet'; }
          else if (isWC) { bgColor = 'bg-blue-500 hover:bg-blue-400 text-white'; icon = '📱'; label = 'WalletConnect'; }
          else if (isInjected) { bgColor = 'bg-green-500 hover:bg-green-400 text-black'; icon = '🦊'; label = 'Wallet'; }
          
          return (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className={`w-full py-2.5 rounded-xl text-sm font-bold ${bgColor} active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isPending ? "Connecting…" : `${icon} Connect ${label}`}
            </button>
          );
        })}
        {connectError && (
          <div className="text-[10px] text-red-400 text-center font-mono break-all mt-2 p-2 bg-red-950/30 rounded border border-red-500/20">
            <div>{connectError.message || connectError.toString()}</div>
            {(connectError.message?.toLowerCase().includes("pending") || connectError.toString().toLowerCase().includes("pending")) && (
              <div className="mt-2 text-yellow-400 font-sans font-semibold border-t border-red-500/20 pt-1.5 text-left">
                💡 <b>MetaMask is waiting:</b> Click the MetaMask fox icon in your browser's toolbar (top right corner) to open the pending connection request and approve it, or restart your browser to reset.
              </div>
            )}
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
