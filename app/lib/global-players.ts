import type { Axol } from "./game";
import type {
  BattleOpponentPayload,
  LeaderboardEntry,
  PlayerSyncPayload,
  PublicPlayer,
} from "./public-player";
import { featuredAvatarUrl } from "./featured-leaderboard";
import { avatarForPlayer, battleTeam, pickChampion } from "./public-player";

export async function syncPublicPlayer(payload: PlayerSyncPayload): Promise<void> {
  if (!payload.wallet || !payload.profile.name.trim()) return;
  await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchLeaderboard(youWallet?: string | null): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/players", { cache: "no-store" });
  if (!res.ok) throw new Error("leaderboard fetch failed");
  const data = (await res.json()) as { entries?: LeaderboardEntry[] };
  return (data.entries ?? []).map((e) => ({
    ...e,
    you: youWallet ? e.wallet === youWallet : e.you,
  }));
}

export async function fetchPublicPlayer(wallet: string): Promise<PublicPlayer | null> {
  const res = await fetch(`/api/players/${encodeURIComponent(wallet)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("player fetch failed");
  return res.json() as Promise<PublicPlayer>;
}

export async function fetchBattleOpponent(
  excludeWallet: string | null,
  trophies: number,
): Promise<BattleOpponentPayload | null> {
  const qs = new URLSearchParams();
  if (excludeWallet) qs.set("exclude", excludeWallet);
  qs.set("trophies", String(trophies));
  const res = await fetch(`/api/players/opponent?${qs}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as BattleOpponentPayload;
  if (!data?.player || !data?.champion) return null;
  return data;
}

export function opponentFromPlayer(p: PublicPlayer): {
  name: string;
  title: string;
  trophies: number;
  rank: string;
  winRate: number;
  team: Axol[];
  isReal: true;
  wallet: string;
  avatar: string;
} {
  const wins = Math.max(p.wins, 1);
  const est = wins + Math.max(3, Math.floor(wins * 0.4));
  return {
    name: p.name,
    title: `${p.league} · real trainer`,
    trophies: p.trophies,
    rank: p.league,
    winRate: Math.min(92, Math.round((wins / est) * 100)),
    team: battleTeam(p),
    isReal: true,
    wallet: p.wallet,
    avatar: featuredAvatarUrl(p.wallet) ?? avatarForPlayer(p),
  };
}
