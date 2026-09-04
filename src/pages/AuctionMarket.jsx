import React, { useState, useEffect, useCallback } from "react";
import { dbGetAuctions } from "../lib/supabase.js";
import AuctionPanel from "../components/AuctionPanel.jsx";

export default function AuctionMarket({ onNavigate, onStepChange, onLogsChange }) {
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // 'active' | 'all' | 'settled'

  // Fetch all auctions
  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbGetAuctions();
      if (data) {
        setAuctions(data);
        if (!selectedAuction && data.length > 0) {
          const liveOne = data.find((a) => !a.settled) || data[0];
          setSelectedAuction(liveOne);
        } else if (selectedAuction) {
          const updated = data.find((a) => a.id === selectedAuction.id);
          if (updated) setSelectedAuction(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAuction]);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  // Filtered list
  const filteredAuctions = auctions.filter((a) => {
    if (filter === "active") return !a.settled;
    if (filter === "settled") return a.settled;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Gasless NFT Auction House
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Off-chain EIP-712 bidding with zero ETH gas. Instant UGF sponsored settlement.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] flex items-center gap-2">
            <span className="text-purple-300">Gas Saved:</span>
            <span className="font-mono font-bold text-green-400">100% (0 ETH)</span>
          </div>
          <button
            onClick={() => onNavigate("my-nfts")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            + Sell My NFT
          </button>
        </div>
      </div>

      {/* Main 2-Column Marketplace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Auction List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0">
          {/* Filters */}
          <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {["active", "all", "settled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filter === f
                    ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
            {isLoading && auctions.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-slate-500 text-xs">
                Loading live auctions…
              </div>
            ) : filteredAuctions.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                <p>No {filter} auctions found.</p>
                <button
                  onClick={() => onNavigate("my-nfts")}
                  className="mt-3 text-xs text-purple-400 font-bold hover:underline"
                >
                  List one of your minted NFTs →
                </button>
              </div>
            ) : (
              filteredAuctions.map((a) => {
                const isSelected = selectedAuction?.id === a.id;
                const isLive = !a.settled && new Date(a.ends_at) > new Date();

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAuction(a)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-purple-400/80 bg-purple-950/40 ring-1 ring-purple-400/30"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{a.nft_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Token #{a.token_id}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-purple-400">
                        ${parseFloat(a.current_bid || a.start_price).toFixed(2)} MUSD
                      </div>
                      <span
                        className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          a.settled
                            ? "bg-slate-800 text-slate-400"
                            : isLive
                            ? "bg-green-950 text-green-400"
                            : "bg-yellow-950 text-yellow-400"
                        }`}
                      >
                        {a.settled ? "Settled" : isLive ? "Live" : "Ended"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Auction Detailed Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <AuctionPanel
            auction={selectedAuction}
            onBidPlaced={fetchAuctions}
            onSettle={fetchAuctions}
            onStepChange={onStepChange}
            onLogsChange={onLogsChange}
          />
        </div>
      </div>
    </div>
  );
}
