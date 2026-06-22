import type { LeaderboardEntry } from "./public-player";

export type TicketLeaderboardEntry = LeaderboardEntry & {
  activityTickets: number;
  sharePct: number;
};

export type TicketLeaderboardPayload = {
  entries: TicketLeaderboardEntry[];
  totalPool: number;
  yourRank: number | null;
  yourTickets: number;
  yourSharePct: number;
  updatedAt: number;
};

export async function fetchTicketLeaderboard(youWallet?: string | null): Promise<TicketLeaderboardPayload> {
  const qs = youWallet ? `?you=${encodeURIComponent(youWallet)}` : "";
  const res = await fetch(`/api/players/tickets${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("ticket leaderboard fetch failed");
  return res.json() as Promise<TicketLeaderboardPayload>;
}
