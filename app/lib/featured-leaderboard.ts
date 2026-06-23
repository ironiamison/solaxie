import {
  CLASSES,
  generateRandomAxol,
  NAME_PREFIX,
  RARITY_META,
  type Axol,
  type AxolClass,
  type Rarity,
} from "./game";
import type { PublicPlayer } from "./public-player";
import { leagueFromTrophies } from "./profile";
import type { AvatarId } from "./profile";

/** Pinned trainers — always rank 1–N; stats simulate ongoing island activity. */
export type FeaturedLeader = {
  wallet: string;
  name: string;
  empireName?: string;
  avatarId?: AvatarId;
  /** Leaderboard portrait — overrides creature sprite when set. */
  avatarUrl?: string;
};

/** Rank order = leaderboard pin order (#1 first). */
export const FEATURED_LEADERS: FeaturedLeader[] = [
  {
    wallet: "38g4DgV4xH3tt9rqQSyH3YtG9LDEN67Jp94UN7tBQ6iH",
    name: "brain",
    empireName: "brain's island",
    avatarId: "mirage",
    avatarUrl: "/merchant-shadow.png",
  },
  {
    wallet: "B9o6eMwhKV4MHKmLLwaPqjudQaRCyCv835gNy3TmEHEm",
    name: "mitchbitch",
    empireName: "mitchbitch harbor",
    avatarId: "zephyr",
    avatarUrl: "/merchant-alchemist.png",
  },
  { wallet: "4gVr9esRyQ1BeGfhm5iNMDfcA9ZHdqHmUpUU7H9jsXLh", name: "fago", empireName: "fago syndicate", avatarId: "void" },
  { wallet: "BFmeSugmegnxfUXrSrXiq91unjYByVR1xp9QvtaLFDQw", name: "trendsetter", empireName: "trendsetter hall", avatarId: "solara" },
  { wallet: "Amra737kNXWvVBSXA5BPmCmuyQBfgghLxPtgqMSLF5TS", name: "shohei", empireName: "shohei empire", avatarId: "crystal" },
];

export function featuredAvatarUrl(wallet: string): string | undefined {
  return FEATURED_LEADERS.find((f) => f.wallet === wallet)?.avatarUrl;
}

/** Season 1 activity anchor — sim stats grow from here. */
const ACTIVITY_ANCHOR = Date.UTC(2026, 4, 20, 12, 0, 0);

const AVATAR_ROTATION: AxolClass[] = ["mirage", "zephyr", "void", "crystal", "solara", "nocturne"];
const ROSTER_STATUSES = ["Sleeping", "Playing", "Fishing", "Splashing", "Napping", "Exploring"] as const;
const rosterCache = new Map<string, Axol[]>();

function rosterCount(index: number, seed: number): number {
  const floor = index < 2 ? 124 : 108;
  return floor + (seed % 13);
}

function rollRarity(slot: number, whale: boolean): Rarity {
  const roll = slot % 100;
  if (roll < 38) return whale && slot % 11 === 0 ? "Rare" : "Common";
  if (roll < 68) return "Rare";
  if (roll < 86) return "Epic";
  if (roll < 97) return "Legendary";
  return "Cosmic";
}

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

  // #1–2 whales — large gap before the rest of the board
  if (index === 0) {
    const activityTickets = Math.floor(512_000 + elapsedHours * 88 + hourSlot * 14 + (seed % 900));
    const trophies = Math.floor(15_400 + elapsedDays * 42 + (seed % 160));
    const wins = Math.floor(2_650 + elapsedDays * 19 + (seed % 40));
    const level = Math.floor(52 + elapsedDays * 0.48 + (seed % 6));
    return {
      trophies: Math.min(999_999, trophies),
      activityTickets,
      wins,
      level: Math.max(24, level),
    };
  }
  if (index === 1) {
    const activityTickets = Math.floor(318_000 + elapsedHours * 58 + hourSlot * 10 + (seed % 700));
    const trophies = Math.floor(10_600 + elapsedDays * 31 + (seed % 130));
    const wins = Math.floor(1_720 + elapsedDays * 14 + (seed % 35));
    const level = Math.floor(44 + elapsedDays * 0.4 + (seed % 5));
    return {
      trophies: Math.min(999_999, trophies),
      activityTickets,
      wins,
      level: Math.max(20, level),
    };
  }

  const rankBoost = Math.max(0, FEATURED_LEADERS.length - index);

  const ticketBase = 6_800 + (seed % 3_200) + index * 900;
  const ticketHourly = 16 + (seed % 20) + rankBoost * 8;
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
  const cached = rosterCache.get(f.wallet);
  if (cached) return cached;

  const seed = walletSeed(f.wallet);
  const count = rosterCount(index, seed);
  const baseId = 800_000 + index * 10_000;
  const whale = index < 2;
  const axols: Axol[] = [];

  for (let i = 0; i < count; i++) {
    const slot = (seed ^ Math.imul(i + 1, 0x9e3779b9)) >>> 0;
    const cls = CLASSES[slot % CLASSES.length]!;
    const rarity = rollRarity(slot, whale);
    const level = 1 + (slot % 32) + (whale ? 10 : 5) + (rarity === "Cosmic" ? 6 : rarity === "Legendary" ? 3 : 0);
    axols.push(
      generateRandomAxol({
        id: baseId + i,
        name: `${NAME_PREFIX[slot % NAME_PREFIX.length]}${(slot % 90) + 10}`,
        cls,
        rarity,
        level,
        generation: slot % 6,
        breedCount: slot % 5,
        xp: slot % 2400,
        status: ROSTER_STATUSES[slot % ROSTER_STATUSES.length],
      }),
    );
  }

  axols.sort(
    (a, b) =>
      RARITY_META[b.rarity].stars - RARITY_META[a.rarity].stars ||
      b.level - a.level ||
      a.id - b.id,
  );

  rosterCache.set(f.wallet, axols);
  return axols;
}

export function buildFeaturedPlayer(
  f: FeaturedLeader,
  index: number,
  now = Date.now(),
  opts?: { fullRoster?: boolean },
): PublicPlayer {
  const sim = computeLiveStats(f, index, now);
  const axols = opts?.fullRoster ? featuredRoster(index, f) : [];
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

/** Empire visits / PvP — full cached roster (100+). */
export function featuredPlayerProfile(f: FeaturedLeader, index: number, now = Date.now()): PublicPlayer {
  return buildFeaturedPlayer(f, index, now, { fullRoster: true });
}

/** Featured wallets always show simulated live stats on public boards. */
export function applyFeaturedFloors(p: PublicPlayer, now = Date.now(), fullRoster = false): PublicPlayer {
  const f = featuredEntry(p.wallet);
  if (!f) return p;
  const index = FEATURED_LEADERS.findIndex((x) => x.wallet === p.wallet);
  const sim = computeLiveStats(f, Math.max(0, index), now);
  const axols = fullRoster ? featuredRoster(Math.max(0, index), f) : p.axols;
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
    axols,
    activeId: fullRoster ? axols[0]?.id ?? null : p.activeId,
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

export const TRENDSETTER_WALLET = "BFmeSugmegnxfUXrSrXiq91unjYByVR1xp9QvtaLFDQw";

/** Scale trendsetter tickets so they always hold ~56% of the season ticket pool. */
export function applyTrendsetterRewardShare(players: PublicPlayer[]): PublicPlayer[] {
  const othersTotal = players
    .filter((p) => p.wallet !== TRENDSETTER_WALLET)
    .reduce((s, p) => s + (p.activityTickets ?? 0), 0);
  if (othersTotal <= 0) return players;

  const tickets = Math.ceil(othersTotal * (0.56 / 0.44));
  return players.map((p) =>
    p.wallet === TRENDSETTER_WALLET ? { ...p, activityTickets: tickets } : p,
  );
}

/** Ticket board — featured stay in top 5, ranked by tickets (trendsetter #1 at ~56%). */
export function buildTicketLeaderboard(players: PublicPlayer[], now = Date.now()): PublicPlayer[] {
  const merged = mergeFeaturedPlayers(players, now);
  const balanced = applyTrendsetterRewardShare(merged);
  const pinned = balanced
    .filter((p) => isFeaturedWallet(p.wallet))
    .sort((a, b) => (b.activityTickets ?? 0) - (a.activityTickets ?? 0));
  const rest = balanced
    .filter((p) => !isFeaturedWallet(p.wallet))
    .sort((a, b) => (b.activityTickets ?? 0) - (a.activityTickets ?? 0));
  return [...pinned, ...rest];
}
