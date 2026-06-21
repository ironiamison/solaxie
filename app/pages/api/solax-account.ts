import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { fetchServerSolaxTokenAccount } from "@/lib/rpc-balance";

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
    const found = await fetchServerSolaxTokenAccount(owner);
    if (!found) return res.status(200).json({ wallet, account: null, balance: 0 });
    return res.status(200).json({
      wallet,
      account: found.account.toBase58(),
      balance: found.balance,
    });
  } catch {
    return res.status(400).json({ error: "invalid wallet" });
  }
}
