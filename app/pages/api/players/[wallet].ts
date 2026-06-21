import type { NextApiRequest, NextApiResponse } from "next";
import { getPlayer } from "@/lib/players-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const wallet = req.query.wallet;
  if (typeof wallet !== "string" || !wallet) {
    return res.status(400).json({ error: "wallet required" });
  }

  if (req.method === "GET") {
    const player = await getPlayer(wallet);
    if (!player) return res.status(404).json({ error: "not found" });
    return res.status(200).json(player);
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ error: "method not allowed" });
}
