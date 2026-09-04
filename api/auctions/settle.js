import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co",
  process.env.SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64"
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auctionId } = req.body;

  try {
    let query = supabase.from("auctions").select("*").eq("settled", false);
    if (auctionId) {
      query = query.eq("id", auctionId);
    }

    const { data: auctions, error: aErr } = await query;
    if (aErr) throw aErr;

    const results = [];

    for (const auction of auctions || []) {
      // Fetch highest bid
      const { data: bids } = await supabase
        .from("bids")
        .select("*")
        .eq("auction_id", auction.id)
        .order("amount", { ascending: false })
        .limit(1);

      const winningBid = bids && bids.length > 0 ? bids[0] : null;

      // Generate a mock or real on-chain settlement tx hash
      const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      await supabase
        .from("auctions")
        .update({
          settled: true,
          tx_hash: txHash,
          current_bid: winningBid ? winningBid.amount : auction.current_bid,
          current_bidder: winningBid ? winningBid.bidder : auction.current_bidder,
        })
        .eq("id", auction.id);

      results.push({
        auctionId: auction.id,
        winner: winningBid ? winningBid.bidder : null,
        amount: winningBid ? winningBid.amount : null,
        txHash,
      });
    }

    return res.status(200).json({ success: true, settled: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
