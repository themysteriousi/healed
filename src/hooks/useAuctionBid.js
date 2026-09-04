import { useState, useCallback } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { dbPlaceBid } from "../lib/supabase.js";

export const EIP712_DOMAIN = {
  name: "Zephyr Auction House",
  version: "1",
  chainId: 84532,
};

export const BID_TYPES = {
  Bid: [
    { name: "auctionId", type: "string" },
    { name: "amount", type: "string" },
    { name: "bidder", type: "address" },
    { name: "nonce", type: "string" },
  ],
};

export function useAuctionBid() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const placeBid = useCallback(
    async ({ auctionId, amountMUSD, currentHighestBid, minIncrement = 0.01 }) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const numericBid = parseFloat(amountMUSD);
      const minRequired = (parseFloat(currentHighestBid) || 0) + parseFloat(minIncrement);
      if (numericBid < minRequired) {
        throw new Error(`Bid must be at least $${minRequired.toFixed(2)} MUSD`);
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const message = {
          auctionId: String(auctionId),
          amount: String(numericBid),
          bidder: address,
          nonce: nonce,
        };

        // Sign EIP-712 off-chain intent (Zero Gas)
        const signature = await signTypedDataAsync({
          domain: EIP712_DOMAIN,
          types: BID_TYPES,
          primaryType: "Bid",
          message,
        });

        // 1. Try sending to server API if available
        let apiSuccess = false;
        try {
          const res = await fetch("/api/auctions/place-bid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auctionId,
              bidder: address,
              amount: numericBid,
              signature,
              nonce,
            }),
          });
          if (res.ok) {
            apiSuccess = true;
          }
        } catch {
          // Fallback to direct Supabase client write
        }

        // 2. Client-side fallback write to Supabase (single auctions table with bids JSONB)
        if (!apiSuccess) {
          await dbPlaceBid({
            auctionId,
            bidder: address,
            amount: numericBid,
            signature,
            nonce,
            isBot: false,
          });
        }

        return { success: true, amount: numericBid, signature };
      } catch (err) {
        const msg = err?.message || "Failed to place bid";
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [address, signTypedDataAsync]
  );

  return {
    placeBid,
    isSubmitting,
    error,
  };
}
