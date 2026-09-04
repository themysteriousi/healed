import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co",
  process.env.SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64"
);

const BOT_BIDDERS = [
  "0x71C...a82F",
  "0x9E2...4b1C",
  "0x3Fa...6D90",
  "0x88B...2E31",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auctionId } = req.body;
  if (!auctionId) {
    return res.status(400).json({ error: "Missing auction ID" });
  }

  try {
    const { data: auction, error: aErr } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", auctionId)
      .single();

    if (aErr || !auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    if (auction.settled) {
      return res.status(400).json({ error: "Auction is already settled" });
    }

    const currentHigh = parseFloat(auction.current_bid || auction.start_price || 0);
    const minInc = parseFloat(auction.min_increment || 0.01);
    const botBid = parseFloat((currentHigh + minInc + Math.random() * 0.05).toFixed(2));
    const randomBot = BOT_BIDDERS[Math.floor(Math.random() * BOT_BIDDERS.length)];

    const { data: bidRecord, error: bErr } = await supabase
      .from("bids")
      .insert({
        auction_id: auctionId,
        bidder: randomBot.toLowerCase(),
        amount: botBid,
        signature: "0xsimulated_bot_signature_" + Math.random().toString(36).substring(2),
        nonce: `bot-${Date.now()}`,
        is_bot: true,
      })
      .select()
      .single();

    if (bErr) throw bErr;

    await supabase
      .from("auctions")
      .update({
        current_bid: botBid,
        current_bidder: randomBot.toLowerCase(),
      })
      .eq("id", auctionId);

    return res.status(200).json({ success: true, bid: bidRecord });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
