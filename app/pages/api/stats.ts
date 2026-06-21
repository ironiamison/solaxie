import type { NextApiRequest, NextApiResponse } from "next";
import { fetchVaultSolax } from "@/lib/economy-chain";
import { getEconomyStats, incrementEconomyStats } from "@/lib/stats-store";
import { PROGRAM_ID, TOKEN_MINT } from "@/utils/anchor";
import type { EconomyTotals } from "@/lib/global-stats";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const [stored, vaultSolax] = await Promise.all([getEconomyStats(), fetchVaultSolax()]);
    const offChain = Math.max(stored.offChainSpent, stored.offChainBurned);
    const totalSunk = offChain + vaultSolax;
    const body: EconomyTotals = {
      offChainSpent: stored.offChainSpent,
      offChainBurned: stored.offChainBurned,
      vaultSolax,
      totalSunk,
      totalSpent: totalSunk,
      totalBurned: totalSunk,
      programId: PROGRAM_ID.toBase58(),
      tokenMint: TOKEN_MINT.toBase58(),
      updatedAt: Math.max(stored.updatedAt, Date.now()),
    };
    return res.status(200).json(body);
  }

  if (req.method === "POST") {
    const spent = Number(req.body?.spent ?? 0);
    const burned = Number(req.body?.burned ?? 0);
    if (!Number.isFinite(spent) || !Number.isFinite(burned) || spent < 0 || burned < 0) {
      return res.status(400).json({ error: "invalid amounts" });
    }
    if (spent === 0 && burned === 0) {
      return res.status(400).json({ error: "nothing to record" });
    }
    await incrementEconomyStats({ spent, burned });
    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
