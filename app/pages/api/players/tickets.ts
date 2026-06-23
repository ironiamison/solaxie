import type { NextApiRequest, NextApiResponse } from "next";
import { listPlayers } from "@/lib/players-store";
import { pinFeaturedLeaderboard } from "@/lib/featured-leaderboard";
import { avatarForPlayer } from "@/lib/public-player";
import { estimateTicketShare } from "@/lib/season";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const you = typeof req.query.you === "string" ? req.query.you : null;
  const players = await listPlayers();
  const sorted = pinFeaturedLeaderboard(players, "activityTickets");
  const totalPool = sorted.reduce((s, p) => s + (p.activityTickets ?? 0), 0);

  const entries = sorted.slice(0, 50).map((p, i) => ({
    rank: i + 1,
    wallet: p.wallet,
    name: p.name,
    trophies: p.trophies,
    avatar: avatarForPlayer(p),
    league: p.league,
    activityTickets: p.activityTickets ?? 0,
    sharePct: estimateTicketShare(p.activityTickets ?? 0, totalPool),
    you: you ? p.wallet === you : false,
  }));

  const youRow = you ? sorted.find((p) => p.wallet === you) : null;
  const yourTickets = youRow?.activityTickets ?? 0;
  const yourRank = youRow
    ? sorted.findIndex((p) => p.wallet === you) + 1
    : null;

  return res.status(200).json({
    entries,
    totalPool,
    yourRank,
    yourTickets,
    yourSharePct: estimateTicketShare(yourTickets, totalPool),
    updatedAt: Date.now(),
  });
}
