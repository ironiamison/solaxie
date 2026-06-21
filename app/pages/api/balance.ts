import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { fetchServerSolaxBalance } from "@/lib/rpc-balance";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const wallet = typeof req.query.wallet === "string" ? req.query.wallet : "";
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  try {
    const owner = new PublicKey(wallet);
    const solax = await fetchServerSolaxBalance(owner);
    return res.status(200).json({ solax, wallet });
  } catch {
    return res.status(400).json({ error: "invalid wallet" });
  }
}
