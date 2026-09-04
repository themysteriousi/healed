import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BADGE_NFT_ADDRESS, BADGE_NFT_ABI } from "../config/contracts.js";
import { NFT_CATALOG } from "../config/nftCatalog.js";
import NFTCard from "../components/NFTCard.jsx";
import { dbCreateAuction, dbGetAuctions } from "../lib/supabase.js";

export default function MyNFTs({ onNavigate }) {
  const { address, isConnected } = useAccount();
  const [mintedList, setMintedList] = useState([]);
  const [selectedForAuction, setSelectedForAuction] = useState(null);
  const [startPrice, setStartPrice] = useState("0.10");
  const [durationMinutes, setDurationMinutes] = useState("5");
  const [isListing, setIsListing] = useState(false);
  const [listSuccessMsg, setListSuccessMsg] = useState(null);
  const [activeAuctions, setActiveAuctions] = useState({});

  // Read on-chain balance
  const { data: balanceData } = useReadContract({
    address: BADGE_NFT_ADDRESS,
    abi: BADGE_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: Boolean(address),
  });

  // Load minted NFTs and check active auctions
  const loadUserNFTs = useCallback(async () => {
    if (!address) {
      setMintedList([]);
      return;
    }

    // 1. Fetch active auctions by this user
    const existingAuctions = await dbGetAuctions();
    const auctionMap = {};
    if (existingAuctions) {
      existingAuctions.forEach((a) => {
        if (!a.settled && a.seller?.toLowerCase() === address.toLowerCase()) {
          auctionMap[a.token_id] = true;
        }
      });
    }
    setActiveAuctions(auctionMap);

    // 2. Fetch local session records or construct based on on-chain balance
    const sessionTokenId = sessionStorage.getItem("lastMintedTokenId") || "1";
    const balanceNum = balanceData ? Number(balanceData) : (sessionStorage.getItem("lastMintedTokenId") ? 1 : 0);

    const items = [];
    if (balanceNum > 0) {
      items.push({
        id: "minted-badge",
        name: "Hackathon 2025 Finisher",
        description: "Official Hackathon 2025 badge minted gaslessly on Base Sepolia.",
        emoji: "🏅",
        tokenId: sessionTokenId,
        priceMUSD: 0.08,
        priceDisplay: "$0.08",
        rarity: "Special Edition",
        badgeColor: "bg-green-900/60 text-green-400",
        contractAddress: BADGE_NFT_ADDRESS,
      });
    }

    setMintedList(items);
  }, [address, balanceData]);

  useEffect(() => {
    loadUserNFTs();
  }, [loadUserNFTs]);

  // Handle listing for auction
  const handleCreateAuction = async (e) => {
    e.preventDefault();
    if (!selectedForAuction || !address) return;

    setIsListing(true);
    setListSuccessMsg(null);

    try {
      const durationMs = parseInt(durationMinutes, 10) * 60 * 1000;
      const endsAt = new Date(Date.now() + durationMs).toISOString();

      await dbCreateAuction({
        seller: address.toLowerCase(),
        nft_contract: BADGE_NFT_ADDRESS,
        token_id: selectedForAuction.tokenId || "1",
        nft_name: selectedForAuction.name,
        nft_emoji: selectedForAuction.emoji || "🏷️",
        start_price: parseFloat(startPrice),
        ends_at: endsAt,
      });

      setListSuccessMsg(`✓ Successfully listed ${selectedForAuction.name} for auction!`);
      setSelectedForAuction(null);
      loadUserNFTs();
    } catch (err) {
      alert("Failed to list auction: " + err.message);
    } finally {
      setIsListing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🖼️</span> My Minted NFTs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All your gaslessly minted credentials and assets on Base Sepolia.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("auction")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-black transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            ⚡ View Auction Marketplace
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {listSuccessMsg && (
        <div className="p-3 rounded-xl bg-green-950/40 border border-green-500/40 text-green-400 text-xs font-mono flex items-center justify-between">
          <span>{listSuccessMsg}</span>
          <button
            onClick={() => onNavigate("auction")}
            className="underline text-green-300 font-bold hover:text-white cursor-pointer ml-4"
          >
            Go to Live Auction →
          </button>
        </div>
      )}

      {/* NFT Grid or Empty State */}
      {!isConnected ? (
        <div className="glass rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">👛</span>
          <h3 className="text-base font-bold text-slate-200">Connect Your Wallet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Connect your wallet to view your minted NFTs and list them on the zero-gas auction marketplace.
          </p>
        </div>
      ) : mintedList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">🏷️</span>
          <h3 className="text-base font-bold text-slate-200">No Minted NFTs Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            You haven't minted any badges or tokens yet. Head over to the Badge Minter to mint your first gasless NFT!
          </p>
          <button
            onClick={() => onNavigate("mint")}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-black transition-all cursor-pointer shadow-lg shadow-green-500/20"
          >
            Mint Your First NFT →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mintedList.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              isMinted={true}
              tokenId={nft.tokenId}
              isAuctionActive={activeAuctions[nft.tokenId]}
              onListAuction={(item) => setSelectedForAuction(item)}
            />
          ))}
        </div>
      )}

      {/* List Modal */}
      {selectedForAuction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl border border-purple-500/40 p-6 max-w-md w-full bg-slate-950 shadow-2xl animate-slide-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚡</span> List for Gasless Auction
              </h3>
              <button
                onClick={() => setSelectedForAuction(null)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <span className="text-3xl">{selectedForAuction.emoji}</span>
              <div>
                <h4 className="text-sm font-bold text-white">{selectedForAuction.name}</h4>
                <p className="text-[11px] text-slate-400">Token #{selectedForAuction.tokenId}</p>
              </div>
            </div>

            <form onSubmit={handleCreateAuction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Starting Price (MUSD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Auction Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="2">2 Minutes (Quick Demo)</option>
                  <option value="5">5 Minutes (Standard)</option>
                  <option value="15">15 Minutes</option>
                  <option value="60">1 Hour</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-300">
                ⚡ <strong>Zero-Gas Bidding:</strong> Bidders will sign off-chain EIP-712 typed signatures without paying any on-chain gas. Settlement is handled by UGF relayers.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForAuction(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isListing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-black cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {isListing ? "Creating Auction…" : "Confirm Listing 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
