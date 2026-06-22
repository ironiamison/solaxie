import type { NextApiRequest, NextApiResponse } from "next";
import {
  addListing,
  findListing,
  getListings,
  purchaseListing,
  removeListing,
} from "@/lib/marketplace-store";
import type { Axol } from "@/lib/game";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const listings = await getListings();
    return res.status(200).json({ listings });
  }

  if (req.method === "POST") {
    const body = req.body as {
      action?: string;
      wallet?: string;
      sellerName?: string;
      axol?: Axol;
      priceSolax?: number;
      listingId?: string;
    };
    const { action, wallet } = body;
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    if (action === "list") {
      if (!body.axol || !body.priceSolax || body.priceSolax < 10_000) {
        return res.status(400).json({ error: "valid axol and price (min 10k) required" });
      }
      const listing = await addListing(wallet, body.sellerName ?? "Trainer", body.axol, body.priceSolax);
      return res.status(201).json(listing);
    }

    if (action === "cancel") {
      if (!body.listingId) return res.status(400).json({ error: "listingId required" });
      const removed = await removeListing(body.listingId, wallet);
      if (!removed) return res.status(404).json({ error: "listing not found" });
      return res.status(200).json({ ok: true, axol: removed.axol });
    }

    if (action === "buy") {
      if (!body.listingId) return res.status(400).json({ error: "listingId required" });
      const listing = await findListing(body.listingId);
      if (!listing) return res.status(404).json({ error: "listing sold or removed" });
      if (listing.sellerWallet === wallet) return res.status(400).json({ error: "cannot buy your own listing" });
      const sold = await purchaseListing(body.listingId, wallet);
      if (!sold) return res.status(409).json({ error: "purchase failed" });
      return res.status(200).json({ axol: sold.axol, priceSolax: sold.priceSolax, sellerWallet: sold.sellerWallet });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
