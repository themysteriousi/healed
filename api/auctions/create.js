import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co",
  process.env.SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64"
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { seller, nft_contract, token_id, nft_name, nft_emoji, start_price, durationMinutes } = req.body;

  if (!seller || !nft_contract || !token_id || !start_price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const durationMs = (parseInt(durationMinutes, 10) || 5) * 60 * 1000;
    const endsAt = new Date(Date.now() + durationMs).toISOString();

    const { data, error } = await supabase
      .from("auctions")
      .insert({
        seller: seller.toLowerCase(),
        nft_contract,
        token_id,
        nft_name: nft_name || "Hackathon Badge",
        nft_emoji: nft_emoji || "🏷️",
        start_price: parseFloat(start_price),
        min_increment: 0.01,
        current_bid: parseFloat(start_price),
        current_bidder: null,
        ends_at: endsAt,
        settled: false,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, auction: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
