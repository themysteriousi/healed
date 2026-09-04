import React from "react";
import { BASE_SEPOLIA_EXPLORER } from "../config/chains.js";

export default function NFTCard({
  nft,
  isSelected,
  onSelect,
  isMinted = false,
  tokenId,
  onListAuction,
  isAuctionActive = false,
}) {
  const {
    name,
    description,
    emoji,
    priceDisplay,
    rarity,
    rarityColor,
    borderColor,
    bgGradient,
    badgeColor,
  } = nft;

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl p-4 transition-all duration-300 glass flex flex-col justify-between cursor-pointer border ${
        isSelected
          ? "border-green-400/80 ring-2 ring-green-500/30 bg-gradient-to-br from-green-950/40 to-slate-900/80 scale-[1.02]"
          : `hover:border-slate-500/60 bg-gradient-to-br ${bgGradient || "from-slate-900/60 to-slate-800/40"} ${borderColor || "border-slate-700/50"}`
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || "bg-slate-800 text-slate-300"}`}>
          {rarity || "Standard"}
        </span>
        <span className="text-xs font-mono font-bold text-green-400">
          {priceDisplay || `$${nft.priceMUSD ?? "0.08"}`}
        </span>
      </div>

      {/* Main Icon & Title */}
      <div className="flex flex-col items-center my-3 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(15,42,26,0.8) 0%, rgba(19,77,46,0.6) 100%)",
            border: "1.5px solid rgba(74,222,128,0.3)",
          }}
        >
          {emoji || "🏷️"}
        </div>
        <h3 className="text-sm font-bold text-slate-100">{name}</h3>
        {tokenId && (
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            Token #{tokenId}
          </span>
        )}
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action buttons / Footer */}
      <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
        {isMinted ? (
          <div className="flex items-center gap-2">
            {tokenId && (
              <a
                href={`${BASE_SEPOLIA_EXPLORER}/token/${nft.contractAddress || ""}?a=${tokenId}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                BaseScan ↗
              </a>
            )}
            {onListAuction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onListAuction(nft);
                }}
                disabled={isAuctionActive}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  isAuctionActive
                    ? "bg-purple-900/40 text-purple-400 border border-purple-500/40 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-400 text-black cursor-pointer shadow-lg shadow-purple-500/20"
                }`}
              >
                {isAuctionActive ? "In Auction" : "List for Sale ⚡"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Gas Required</span>
            <span className="text-green-400 font-medium">0 ETH (Gasless)</span>
          </div>
        )}
      </div>
    </div>
  );
}
