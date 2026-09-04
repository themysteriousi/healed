import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Global Multi-User Sync using single 'auctions' table ─────────────────────

export async function dbCreateAuction(auctionData) {
  const newId = `auc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: newId,
    created_at: new Date().toISOString(),
    settled: false,
    current_bid: parseFloat(auctionData.start_price),
    current_bidder: null,
    min_increment: 0.01,
    bids: [],
    ...auctionData,
  };

  const { data, error } = await supabase
    .from("auctions")
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function dbGetAuctions() {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase fetch warning:", error.message);
    return [];
  }

  return data || [];
}

export async function dbPlaceBid({ auctionId, bidder, amount, signature, nonce, isBot = false }) {
  const numericAmount = parseFloat(amount);
  const newBid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bidder: bidder.toLowerCase(),
    amount: numericAmount,
    signature: signature || "0x_sig",
    nonce: nonce || `${Date.now()}`,
    is_bot: Boolean(isBot),
    created_at: new Date().toISOString(),
  };

  // 1. Fetch current auction to get existing bids
  const { data: currentAuction, error: fetchErr } = await supabase
    .from("auctions")
    .select("bids, ends_at")
    .eq("id", auctionId)
    .single();

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }

  const existingBids = Array.isArray(currentAuction?.bids) ? currentAuction.bids : [];
  const updatedBids = [newBid, ...existingBids];

  // Anti-sniping: extend by 2 min if placed near end
  let endsAt = currentAuction?.ends_at;
  if (endsAt) {
    const timeRemaining = new Date(endsAt).getTime() - Date.now();
    if (timeRemaining < 2 * 60 * 1000) {
      endsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    }
  }

  // 2. Update auction record with new highest bid and bids array
  const { data: updatedAuction, error: updateErr } = await supabase
    .from("auctions")
    .update({
      current_bid: numericAmount,
      current_bidder: bidder.toLowerCase(),
      bids: updatedBids,
      ends_at: endsAt,
    })
    .eq("id", auctionId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  return newBid;
}

export async function dbGetBids(auctionId) {
  const { data, error } = await supabase
    .from("auctions")
    .select("bids")
    .eq("id", auctionId)
    .single();

  if (error || !data || !Array.isArray(data.bids)) {
    return [];
  }

  return data.bids;
}

export async function dbSettleAuction(auctionId, txHash) {
  const { error } = await supabase
    .from("auctions")
    .update({
      settled: true,
      tx_hash: txHash,
    })
    .eq("id", auctionId);

  if (error) {
    console.error("Supabase settlement error:", error.message);
  }
}
