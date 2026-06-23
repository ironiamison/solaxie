import type { NextApiRequest, NextApiResponse } from "next";
import { featuredAvatarUrl } from "@/lib/featured-leaderboard";
import { listPlayers, upsertPlayer } from "@/lib/players-store";
import { avatarForPlayer, toPublicPlayer, type PlayerSyncPayload } from "@/lib/public-player";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const you = typeof req.query.you === "string" ? req.query.you : null;
    const players = await listPlayers();
    const entries = players.map((p, i) => ({
      rank: i + 1,
      wallet: p.wallet,
      name: p.name,
      trophies: p.trophies,
      avatar: featuredAvatarUrl(p.wallet) ?? avatarForPlayer(p),
      league: p.league,
      you: you ? p.wallet === you : false,
    }));
    return res.status(200).json({ entries });
  }

  if (req.method === "POST") {
    const body = req.body as PlayerSyncPayload;
    if (!body?.wallet || typeof body.wallet !== "string") {
      return res.status(400).json({ error: "wallet required" });
    }
    if (!body.profile?.name?.trim()) {
      return res.status(400).json({ error: "profile name required" });
    }
    const player = toPublicPlayer(body);
    await upsertPlayer(player);
    return res.status(201).json({ ok: true, player });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
