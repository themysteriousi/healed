import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Storage Keys for Resilient Local Fallback ────────────────────────────────
const LOCAL_AUCTIONS_KEY = "zephyr_local_auctions";
const LOCAL_BIDS_KEY = "zephyr_local_bids";

function getLocalAuctions() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUCTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalAuctions(list) {
  try {
    localStorage.setItem(LOCAL_AUCTIONS_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalBids() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BIDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalBids(list) {
  try {
    localStorage.setItem(LOCAL_BIDS_KEY, JSON.stringify(list));
  } catch {}
}

// ── Unified Auction & Bid DB Operations with Automatic Fallback ─────────────

export async function dbCreateAuction(auctionData) {
  const newId = `auc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: newId,
    created_at: new Date().toISOString(),
    settled: false,
    current_bid: auctionData.start_price,
    current_bidder: null,
    min_increment: 0.01,
    ...auctionData,
  };

  try {
    const { data, error } = await supabase.from("auctions").insert(record).select().single();
    if (!error && data) {
      return data;
    }
  } catch {}

  // Fallback to local storage
  const current = getLocalAuctions();
  current.unshift(record);
  saveLocalAuctions(current);
  return record;
}

export async function dbGetAuctions() {
  try {
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {}

  return getLocalAuctions();
}

export async function dbPlaceBid({ auctionId, bidder, amount, signature, nonce, isBot = false }) {
  const newBid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    auction_id: auctionId,
    bidder: bidder.toLowerCase(),
    amount: parseFloat(amount),
    signature: signature || "0x_sig",
    nonce: nonce || `${Date.now()}`,
    is_bot: Boolean(isBot),
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("bids").insert(newBid);
    await supabase
      .from("auctions")
      .update({
        current_bid: newBid.amount,
        current_bidder: newBid.bidder,
      })
      .eq("id", auctionId);
  } catch {}

  // Always keep local in sync
  const allBids = getLocalBids();
  allBids.unshift(newBid);
  saveLocalBids(allBids);

  const auctions = getLocalAuctions();
  const idx = auctions.findIndex((a) => a.id === auctionId);
  if (idx !== -1) {
    auctions[idx].current_bid = newBid.amount;
    auctions[idx].current_bidder = newBid.bidder;
    saveLocalAuctions(auctions);
  }

  return newBid;
}

export async function dbGetBids(auctionId) {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {}

  return getLocalBids().filter((b) => b.auction_id === auctionId);
}

export async function dbSettleAuction(auctionId, txHash) {
  try {
    await supabase
      .from("auctions")
      .update({
        settled: true,
        tx_hash: txHash,
      })
      .eq("id", auctionId);
  } catch {}

  const auctions = getLocalAuctions();
  const idx = auctions.findIndex((a) => a.id === auctionId);
  if (idx !== -1) {
    auctions[idx].settled = true;
    auctions[idx].tx_hash = txHash;
    saveLocalAuctions(auctions);
  }
}
