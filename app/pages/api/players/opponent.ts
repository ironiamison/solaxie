import type { NextApiRequest, NextApiResponse } from "next";
import { pickOpponent } from "@/lib/players-store";
import { pickChampion } from "@/lib/public-player";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const exclude = typeof req.query.exclude === "string" ? req.query.exclude : "";
  const trophies = Number(req.query.trophies ?? 0);

  const player = await pickOpponent(exclude, Number.isFinite(trophies) ? trophies : 0);
  if (!player) return res.status(404).json({ error: "no opponents" });

  const champion = pickChampion(player);
  if (!champion) return res.status(404).json({ error: "no champion" });

  return res.status(200).json({ player, champion, isReal: true });
}
