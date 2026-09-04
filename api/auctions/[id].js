import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://pxhfhikhuvnvevifioqg.supabase.co",
  process.env.SUPABASE_ANON_KEY || "sb_publishable_kVGjEzT0YsL1lw6DJPY2wA_O7q1bE64"
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing auction ID" });
  }

  try {
    const { data: auction, error: aErr } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", id)
      .single();

    if (aErr || !auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const { data: bids } = await supabase
      .from("bids")
      .select("*")
      .eq("auction_id", id)
      .order("created_at", { ascending: false });

    return res.status(200).json({ auction, bids: bids || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
