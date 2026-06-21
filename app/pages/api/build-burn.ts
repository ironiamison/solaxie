import type { NextApiRequest, NextApiResponse } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  buildSolaxBurnTransaction,
  serializeBurnTransaction,
} from "@/lib/solax-burn";
import { fetchServerSolaxTokenAccount, serverRpcUrls } from "@/lib/rpc-balance";

async function serverConnection(): Promise<Connection> {
  for (const url of serverRpcUrls()) {
    try {
      const connection = new Connection(url, "confirmed");
      await connection.getLatestBlockhash("confirmed");
      return connection;
    } catch {
      // try next RPC
    }
  }
  return new Connection(serverRpcUrls()[0] ?? "https://api.mainnet-beta.solana.com", "confirmed");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const { wallet, amount } = req.body as { wallet?: string; amount?: number };
  if (!wallet || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "wallet and amount required" });
  }

  try {
    const owner = new PublicKey(wallet);
    const held = await fetchServerSolaxTokenAccount(owner);
    if (!held) {
      return res.status(400).json({ error: "No SOLAX token account found for this wallet" });
    }
    if (held.balance < amount) {
      return res.status(400).json({
        error: `Need ${amount.toLocaleString()} SOLAX (you have ${Math.floor(held.balance).toLocaleString()})`,
        balance: held.balance,
      });
    }

    const connection = await serverConnection();
    const built = await buildSolaxBurnTransaction(connection, owner, amount, held.account);

    return res.status(200).json({
      wallet,
      amount,
      account: held.account.toBase58(),
      balance: held.balance,
      transaction: serializeBurnTransaction(built.transaction),
      blockhash: built.blockhash,
      lastValidBlockHeight: built.lastValidBlockHeight,
    });
  } catch (e) {
    console.error("[build-burn]", e);
    return res.status(500).json({ error: "Failed to build burn transaction" });
  }
}
