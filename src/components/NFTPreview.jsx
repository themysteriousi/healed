import { BASE_SEPOLIA_EXPLORER } from "../config/chains.js";

/**
 * NFT success card shown after a confirmed on-chain mint.
 */
export default function NFTPreview({ txHash, tokenId, smartAddress }) {
  const txUrl = txHash ? `${BASE_SEPOLIA_EXPLORER}/tx/${txHash}` : null;
  const addressUrl = smartAddress ? `${BASE_SEPOLIA_EXPLORER}/address/${smartAddress}` : null;

  return (
    <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-950/40 to-slate-900/60 p-4 animate-slide-in-up">
      {/* Badge icon */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 glow-green-sm"
          style={{
            background: "linear-gradient(135deg, #0f2a1a 0%, #134d2e 100%)",
            border: "1.5px solid rgba(74,222,128,0.4)",
          }}
        >
          🏅
        </div>
        <div>
          <p className="text-sm font-bold text-white">Hackathon 2025 Finisher</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            ERC-721 · Token #{tokenId ?? "…"}
          </p>
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-green-400">
            <span>✓</span> Minted & confirmed on-chain
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {tokenId && (
          <div className="flex justify-between">
            <span className="text-slate-500">Token ID</span>
            <span className="font-mono text-slate-200">#{tokenId}</span>
          </div>
        )}
        {smartAddress && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Smart Account</span>
            <a
              href={addressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              {smartAddress.slice(0, 8)}…{smartAddress.slice(-6)} ↗
            </a>
          </div>
        )}
        {txHash && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Transaction</span>
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
            </a>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Gas paid</span>
          <span className="text-green-400 font-semibold">0 ETH (sponsored)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">MUSD fee</span>
          <span className="text-slate-200">$0.08</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Network</span>
          <span className="text-slate-200">Base Sepolia</span>
        </div>
      </div>

      {txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="basescan-link"
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-blue-500/30 bg-blue-950/30 text-[11px] text-blue-400 hover:text-blue-300 hover:border-blue-400/50 transition-all"
        >
          View on BaseScan ↗
        </a>
      )}
    </div>
  );
}
