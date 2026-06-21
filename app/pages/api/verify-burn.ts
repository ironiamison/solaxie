import type { NextApiRequest, NextApiResponse } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifySolaxBurnTransfer } from "@/lib/solax-burn";
import { RPC_URL } from "@/utils/anchor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const { signature, wallet, amount } = req.body as {
    signature?: string;
    wallet?: string;
    amount?: number;
  };

  if (!signature || !wallet || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "signature, wallet, and amount required" });
  }

  try {
    const owner = new PublicKey(wallet);
    const connection = new Connection(RPC_URL, "confirmed");
    const verified = await verifySolaxBurnTransfer(connection, signature, owner, amount);
    return res.status(200).json({ verified, signature });
  } catch {
    return res.status(400).json({ error: "verification failed", verified: false });
  }
}
