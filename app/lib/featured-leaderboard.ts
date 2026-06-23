import { generateRandomAxol, type Axol, type AxolClass } from "./game";
import type { PublicPlayer } from "./public-player";
import { leagueFromTrophies } from "./profile";
import type { AvatarId } from "./profile";

/** Pinned trainers — always rank 1–N; stats simulate ongoing island activity. */
export type FeaturedLeader = {
  wallet: string;
  name: string;
  empireName?: string;
  avatarId?: AvatarId;
};

/** Rank order = leaderboard pin order (#1 first). */
export const FEATURED_LEADERS: FeaturedLeader[] = [
  { wallet: "38g4DgV4xH3tt9rqQSyH3YtG9LDEN67Jp94UN7tBQ6iH", name: "brain", empireName: "brain's island", avatarId: "mirage" },
  { wallet: "B9o6eMwhKV4MHKmLLwaPqjudQaRCyCv835gNy3TmEHEm", name: "mitchbitch", empireName: "mitchbitch harbor", avatarId: "zephyr" },
  { wallet: "4gVr9esRyQ1BeGfhm5iNMDfcA9ZHdqHmUpUU7H9jsXLh", name: "fago", empireName: "fago syndicate", avatarId: "void" },
  { wallet: "BFmeSugmegnxfUXrSrXiq91unjYByVR1xp9QvtaLFDQw", name: "trendsetter", empireName: "trendsetter hall", avatarId: "solara" },
  { wallet: "Amra737kNXWvVBSXA5BPmCmuyQBfgghLxPtgqMSLF5TS", name: "shohei", empireName: "shohei empire", avatarId: "crystal" },
];

/** Season 1 activity anchor — sim stats grow from here. */
const ACTIVITY_ANCHOR = Date.UTC(2026, 4, 20, 12, 0, 0);

const AVATAR_ROTATION: AxolClass[] = ["mirage", "zephyr", "void", "crystal", "solara", "nocturne"];

function walletSeed(wallet: string): number {
  let h = 2166136261;
  for (let i = 0; i < wallet.length; i++) {
    h ^= wallet.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type LiveStats = {
  trophies: number;
  activityTickets: number;
  wins: number;
  level: number;
};

/** Time-varying stats — ticks up hourly/daily so boards feel alive. */
export function computeLiveStats(f: FeaturedLeader, index: number, now = Date.now()): LiveStats {
  const seed = walletSeed(f.wallet);
  const elapsedMs = Math.max(0, now - ACTIVITY_ANCHOR);
  const elapsedHours = elapsedMs / 3_600_000;
  const elapsedDays = elapsedMs / 86_400_000;
  const hourSlot = Math.floor(elapsedHours);
  const rankBoost = Math.max(0, FEATURED_LEADERS.length - index);

  const ticketBase = 9_200 + (seed % 4_800) + index * 1_400;
  const ticketHourly = 22 + (seed % 28) + rankBoost * 11;
  const hourPulse = (hourSlot % 5) * (2 + (seed % 4));
  let sessionTickets = 0;
  const dayCount = Math.floor(elapsedDays);
  for (let d = 0; d <= dayCount; d++) {
    const daySeed = (seed ^ Math.imul(d + 1, 0x9e3779b1)) >>> 0;
    if (daySeed % 5 === 0) continue;
    sessionTickets += 140 + (daySeed % 380) + rankBoost * 22;
  }
  const activityTickets = Math.floor(ticketBase + elapsedHours * ticketHourly + hourPulse + sessionTickets);

  const trophyBase = 520 + (seed % 280) + index * 40;
  const trophyDaily = 9 + (seed % 14) + rankBoost * 3;
  const trophyHourly = hourSlot % 3 === 0 ? 1 + (seed % 3) : 0;
  const trophies = Math.floor(trophyBase + elapsedDays * trophyDaily + trophyHourly * (hourSlot % 24));

  const wins = Math.floor(trophies / 6.2 + 18 + (seed % 35) + elapsedDays * (0.6 + rankBoost * 0.15));
  const level = Math.floor(16 + elapsedDays * 0.42 + (seed % 7) + rankBoost * 1.8);

  return {
    trophies: Math.min(999_999, Math.max(120, trophies)),
    activityTickets: Math.max(500, activityTickets),
    wins: Math.max(8, wins),
    level: Math.max(8, level),
  };
}

export function isFeaturedWallet(wallet: string): boolean {
  return FEATURED_LEADERS.some((f) => f.wallet === wallet);
}

export function featuredEntry(wallet: string): FeaturedLeader | undefined {
  return FEATURED_LEADERS.find((f) => f.wallet === wallet);
}

function featuredRoster(index: number, f: FeaturedLeader): Axol[] {
  const cls = f.avatarId ?? AVATAR_ROTATION[index % AVATAR_ROTATION.length]!;
  const seed = walletSeed(f.wallet);
  const champion = generateRandomAxol({
    id: 9000 + index,
    cls,
    rarity: index === 0 ? "Cosmic" : index < 2 ? "Legendary" : "Epic",
    level: 26 + index * 2 + (seed % 6),
    generation: 2 + (seed % 3),
    breedCount: 1 + (seed % 2),
    xp: 1800 + (seed % 900),
    status: "Swimming",
  });
  const supportCls = AVATAR_ROTATION[(index + 2) % AVATAR_ROTATION.length]!;
  const support = generateRandomAxol({
    id: 9100 + index,
    cls: supportCls,
    rarity: "Epic",
    level: 19 + (seed % 8),
    generation: 1,
    breedCount: seed % 3,
    xp: 600 + (seed % 400),
    status: "Exploring",
  });
  return [champion, support];
}

export function buildFeaturedPlayer(f: FeaturedLeader, index: number, now = Date.now()): PublicPlayer {
  const sim = computeLiveStats(f, index, now);
  const axols = featuredRoster(index, f);
  return {
    wallet: f.wallet,
    name: f.name,
    empireName: f.empireName ?? `${f.name} Empire`,
    avatarId: f.avatarId ?? AVATAR_ROTATION[index % AVATAR_ROTATION.length]!,
    level: sim.level,
    league: leagueFromTrophies(sim.trophies),
    trophies: sim.trophies,
    rank: index + 1,
    activityTickets: sim.activityTickets,
    wins: sim.wins,
    axols,
    activeId: axols[0]?.id ?? null,
    updatedAt: now,
  };
}

/** Featured wallets always show simulated live stats on public boards. */
export function applyFeaturedFloors(p: PublicPlayer, now = Date.now()): PublicPlayer {
  const f = featuredEntry(p.wallet);
  if (!f) return p;
  const index = FEATURED_LEADERS.findIndex((x) => x.wallet === p.wallet);
  const sim = computeLiveStats(f, Math.max(0, index), now);
  return {
    ...p,
    name: f.name || p.name,
    empireName: f.empireName ?? p.empireName,
    avatarId: f.avatarId ?? p.avatarId,
    level: sim.level,
    trophies: sim.trophies,
    league: leagueFromTrophies(sim.trophies),
    activityTickets: sim.activityTickets,
    wins: sim.wins,
    updatedAt: now,
  };
}

export function mergeFeaturedPlayers(players: PublicPlayer[], now = Date.now()): PublicPlayer[] {
  if (!FEATURED_LEADERS.length) return players;

  const byWallet = new Map(players.map((p) => [p.wallet, applyFeaturedFloors(p, now)]));

  FEATURED_LEADERS.forEach((f, i) => {
    const existing = byWallet.get(f.wallet);
    byWallet.set(f.wallet, existing ? applyFeaturedFloors(existing, now) : buildFeaturedPlayer(f, i, now));
  });

  return Array.from(byWallet.values());
}

export function pinFeaturedLeaderboard(
  players: PublicPlayer[],
  sortKey: "trophies" | "activityTickets",
  now = Date.now(),
): PublicPlayer[] {
  const merged = mergeFeaturedPlayers(players, now);
  if (!FEATURED_LEADERS.length) {
    return [...merged].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }

  const pinned: PublicPlayer[] = [];
  for (let i = 0; i < FEATURED_LEADERS.length; i++) {
    const f = FEATURED_LEADERS[i]!;
    const row = merged.find((p) => p.wallet === f.wallet) ?? buildFeaturedPlayer(f, i, now);
    pinned.push(applyFeaturedFloors(row, now));
  }

  const rest = merged
    .filter((p) => !isFeaturedWallet(p.wallet))
    .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));

  return [...pinned, ...rest];
}
