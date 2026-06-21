import type { NextApiRequest, NextApiResponse } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchWalletSolaxBalance } from "@/lib/wallet-balance";
import { RPC_URL } from "@/utils/anchor";

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
    const connection = new Connection(RPC_URL, "confirmed");
    const solax = await fetchWalletSolaxBalance(connection, owner);
    return res.status(200).json({ solax, wallet });
  } catch {
    return res.status(400).json({ error: "invalid wallet" });
  }
}
