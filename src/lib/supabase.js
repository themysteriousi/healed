import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Global Multi-User Sync ───────────────────────────────────────────────────

export async function dbCreateAuction(auctionData) {
  const record = {
    seller: auctionData.seller.toLowerCase(),
    nft_contract: auctionData.nft_contract,
    token_id: String(auctionData.token_id),
    nft_name: auctionData.nft_name || "Hackathon Badge",
    nft_emoji: auctionData.nft_emoji || "🏷️",
    start_price: parseFloat(auctionData.start_price),
    min_increment: 0.01,
    current_bid: parseFloat(auctionData.start_price),
    current_bidder: null,
    bids: [],
    ends_at: auctionData.ends_at,
    settled: false,
    created_at: new Date().toISOString(),
  };

  // Try insert with bids field
  let { data, error } = await supabase
    .from("auctions")
    .insert([record])
    .select()
    .single();

  // Fallback: If 'bids' column is missing in DB, remove bids key and retry
  if (error && error.message.includes("bids")) {
    delete record.bids;
    const retry = await supabase
      .from("auctions")
      .insert([record])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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
    auction_id: auctionId,
    bidder: bidder.toLowerCase(),
    amount: numericAmount,
    signature: signature || "0x_sig",
    nonce: nonce || `${Date.now()}`,
    is_bot: Boolean(isBot),
    created_at: new Date().toISOString(),
  };

  // 1. Try inserting into 'bids' table (2-table schema)
  let insertedBid = null;
  const { data: bData, error: bidErr } = await supabase
    .from("bids")
    .insert([newBid])
    .select()
    .single();

  if (!bidErr) {
    insertedBid = bData;
  }

  // 2. Fetch auction to update current_bid, current_bidder & bids jsonb array
  const { data: currentAuction } = await supabase
    .from("auctions")
    .select("bids, ends_at")
    .eq("id", auctionId)
    .single();

  let endsAt = currentAuction?.ends_at;
  if (endsAt) {
    const timeRemaining = new Date(endsAt).getTime() - Date.now();
    if (timeRemaining < 2 * 60 * 1000) {
      endsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    }
  }

  const updatePayload = {
    current_bid: numericAmount,
    current_bidder: bidder.toLowerCase(),
    ends_at: endsAt,
  };

  if (currentAuction && Array.isArray(currentAuction.bids)) {
    updatePayload.bids = [newBid, ...currentAuction.bids];
  }

  await supabase
    .from("auctions")
    .update(updatePayload)
    .eq("id", auctionId);

  return insertedBid || newBid;
}

export async function dbGetBids(auctionId) {
  // 1. Try fetching from 'bids' table
  const { data: bidsData, error: bidsErr } = await supabase
    .from("bids")
    .select("*")
    .eq("auction_id", auctionId)
    .order("created_at", { ascending: false });

  if (!bidsErr && bidsData && bidsData.length > 0) {
    return bidsData;
  }

  // 2. Fallback to 'bids' column in 'auctions' table
  const { data, error } = await supabase
    .from("auctions")
    .select("bids")
    .eq("id", auctionId)
    .single();

  if (!error && data && Array.isArray(data.bids)) {
    return data.bids;
  }

  return bidsData || [];
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
