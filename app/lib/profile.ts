import type { AxolClass } from "./game";
import { trainerXpToNext } from "./progression";

export type AvatarId = AxolClass;

export type BattleHistoryEntry = {
  id: number;
  opponent: string;
  win: boolean;
  axolName: string;
  axolCls: AxolClass;
  rewardXp: number;
  trophiesDelta: number;
  at: string;
};

export type TrainerProfile = {
  name: string;
  empireName: string;
  avatarId: AvatarId;
  /** Trainer account level — XP from all island activity. */
  level: number;
  xp: number;
  xpToNext: number;
  /** Arena competitive league (trophy ladder only). */
  league: string;
  trophies: number;
  leagueMax: number;
  rank: number;
  /** Participation score for creator-reward seasons (all activity). */
  activityTickets: number;
  chestWins: number;
  chestTarget: number;
  chestLevel: number;
  /** False until the player picks a trainer name on first login. */
  usernameSet?: boolean;
};

/** Retuned arena bands — faster early promotions (100 → 250 → 500 …). */
export const LEAGUE_BANDS: { name: string; min: number; max: number }[] = [
  { name: "Bronze IV", min: 1, max: 99 },
  { name: "Bronze III", min: 100, max: 249 },
  { name: "Bronze II", min: 250, max: 499 },
  { name: "Bronze I", min: 500, max: 799 },
  { name: "Silver III", min: 800, max: 1099 },
  { name: "Silver II", min: 1100, max: 1399 },
  { name: "Silver I", min: 1400, max: 1799 },
  { name: "Gold III", min: 1800, max: 2199 },
  { name: "Gold II", min: 2200, max: 2599 },
  { name: "Gold I", min: 2600, max: 999_999 },
];

/** Arena league from trophy count — single source of truth for rank display. */
export function leagueFromTrophies(trophies: number): string {
  if (trophies <= 0) return "No Rank";
  for (const band of LEAGUE_BANDS) {
    if (trophies <= band.max) return band.name;
  }
  return LEAGUE_BANDS[LEAGUE_BANDS.length - 1]!.name;
}

export function nextLeagueFromTrophies(trophies: number): string | null {
  if (trophies <= 0) return "Bronze IV";
  const current = leagueFromTrophies(trophies);
  const idx = LEAGUE_BANDS.findIndex((b) => b.name === current);
  if (idx < 0 || idx >= LEAGUE_BANDS.length - 1) return null;
  return LEAGUE_BANDS[idx + 1]!.name;
}

/** Progress within the current league band (for arena ladder UI). */
export function leagueTierProgress(trophies: number): { floor: number; ceil: number; pct: number; toNext: number } {
  if (trophies <= 0) return { floor: 0, ceil: 100, pct: 0, toNext: 100 };
  for (const band of LEAGUE_BANDS) {
    if (trophies <= band.max) {
      const floor = band.min;
      const ceil = band.max + 1;
      const span = ceil - floor;
      const pct = span > 0 ? ((trophies - floor) / span) * 100 : 100;
      return { floor, ceil: band.max, pct: Math.min(100, pct), toNext: band.max + 1 - trophies };
    }
  }
  const last = LEAGUE_BANDS[LEAGUE_BANDS.length - 1]!;
  return { floor: last.min, ceil: last.max, pct: 100, toNext: 0 };
}

export function applyTrophyDelta(profile: TrainerProfile, delta: number): TrainerProfile {
  const trophies = Math.max(0, profile.trophies + delta);
  const league = leagueFromTrophies(trophies);
  const { ceil } = leagueTierProgress(trophies);
  return { ...profile, trophies, league, leagueMax: trophies <= 0 ? 100 : ceil };
}

export function normalizeProfile(profile: TrainerProfile): TrainerProfile {
  const activityTickets = profile.activityTickets ?? 0;
  let level = Math.max(1, profile.level || 1);
  let xp = profile.xp ?? 0;
  let xpToNext = 100 + Math.max(0, level - 1) * 75;
  while (xp >= xpToNext && level < 99) {
    xp -= xpToNext;
    level += 1;
    xpToNext = 100 + Math.max(0, level - 1) * 75;
  }
  const league = leagueFromTrophies(profile.trophies);
  const { ceil } = leagueTierProgress(profile.trophies);
  return {
    ...profile,
    activityTickets,
    level,
    xp,
    xpToNext,
    league,
    leagueMax: profile.trophies <= 0 ? 100 : ceil,
  };
}

/** Brand-new wallet — level 1, unranked, username required. */
export const STARTER_PROFILE: TrainerProfile = {
  name: "",
  empireName: "",
  avatarId: "bird",
  level: 1,
  xp: 0,
  xpToNext: 100,
  league: "No Rank",
  trophies: 0,
  leagueMax: 100,
  rank: 0,
  activityTickets: 0,
  chestWins: 0,
  chestTarget: 10,
  chestLevel: 1,
  usernameSet: false,
};

/** Demo / legacy saves that already have a trainer identity. */
export const DEFAULT_PROFILE: TrainerProfile = {
  name: "SolanaKid",
  empireName: "SolanaKid Empire",
  avatarId: "bird",
  level: 7,
  xp: 680,
  xpToNext: 550,
  league: "Silver II",
  trophies: 1254,
  leagueMax: 1399,
  rank: 124,
  activityTickets: 420,
  chestWins: 6,
  chestTarget: 10,
  chestLevel: 8,
  usernameSet: true,
};

export function needsUsername(profile: TrainerProfile): boolean {
  if (profile.usernameSet === false) return true;
  if (profile.usernameSet === true) return false;
  return !profile.name.trim();
}

export function validateUsername(raw: string): string | null {
  const name = raw.trim();
  if (name.length < 3) return "At least 3 characters";
  if (name.length > 16) return "Max 16 characters";
  if (!/^[a-zA-Z0-9._]+$/.test(name)) return "Letters, numbers, dots and underscores only";
  return null;
}

/** Normalize display name — append `.sol` when no domain suffix given. */
export function formatTrainerName(raw: string): string {
  const name = raw.trim();
  if (!name) return "";
  return name.includes(".") ? name : `${name}.sol`;
}

/** Circular PFP portraits — one per base class. */
export const PFP_AVATARS: Record<AvatarId, { src: string; label: string; ring: string }> = {
  plant: { src: "/pfp-plant.png", label: "Plant", ring: "#54e07a" },
  bug: { src: "/pfp-bug.png", label: "Bug", ring: "#a779ff" },
  bird: { src: "/pfp-bird.png", label: "Bird", ring: "#ff5fb0" },
  aquatic: { src: "/pfp-aquatic.png", label: "Aquatic", ring: "#3db4ff" },
  beast: { src: "/pfp-beast.png", label: "Beast", ring: "#ffa83d" },
  reptile: { src: "/pfp-reptile.png", label: "Reptile", ring: "#ffd24a" },
  crystal: { src: "/sprites/crystal.png", label: "Crystal", ring: "#7ecbff" },
  shadow: { src: "/sprites/shadow.png", label: "Shadow", ring: "#7a5cff" },
  mech: { src: "/sprites/mech.png", label: "Mech", ring: "#5ce0ff" },
  ember: { src: "/sprites/ember.png", label: "Ember", ring: "#ff6b3d" },
  void: { src: "/sprites/void.png", label: "Void", ring: "#b06bff" },
};

export function avatarSrc(id: AvatarId): string {
  return PFP_AVATARS[id]?.src ?? "/avatar-axolotl.png";
}

export type LeaderboardRow = { rank: number; name: string; trophies: number; avatar: string; you?: boolean };

export const MOCK_LEADERBOARD: LeaderboardRow[] = [
  { rank: 1, name: "AxolMaster", trophies: 2450, avatar: "/pfp-bird.png" },
  { rank: 2, name: "CoralKing", trophies: 2210, avatar: "/pfp-aquatic.png" },
  { rank: 3, name: "NeonFin", trophies: 1980, avatar: "/pfp-aquatic.png" },
  { rank: 4, name: "SolanaKid", trophies: 1890, avatar: "/pfp-bird.png", you: true },
  { rank: 5, name: "VoidSerpent", trophies: 1750, avatar: "/pfp-reptile.png" },
];

export type LegendSlot = { title: string; name: string; detail: string; sprite: string; accent: string };

export const MOCK_LEGENDS: LegendSlot[] = [
  { title: "Oldest Axol", name: "Elder Root", detail: "Gen 1", sprite: "/sprites/plant.png", accent: "#54e07a" },
  { title: "Highest Level", name: "Beast King", detail: "Lv. 50", sprite: "/sprites/beast.png", accent: "#ffa83d" },
  { title: "Most Wins", name: "AxolMaster", detail: "1,250 wins", sprite: "/sprites/bird.png", accent: "#ff5fb0" },
  { title: "First Cosmic", name: "Cosmic Bird", detail: "Cosmic", sprite: "/sprites/cosmetics/cosmic-bird.png", accent: "#c08bff" },
  { title: "Highest Gen", name: "Gen 5 Beast", detail: "Gen 5", sprite: "/sprites/aquatic.png", accent: "#3db4ff" },
];

export type EmpireFeedItem = { id: string; who: string; what: string; icon: string; t: string };

export const MOCK_EMPIRE_FEED: EmpireFeedItem[] = [
  { id: "1", who: "James", what: "bred a Gen 4 Aquatic", icon: "/sprites/aquatic.png", t: "2m ago" },
  { id: "2", who: "Sarah", what: "hatched an Epic Egg", icon: "/egg-cosmic.png", t: "15m ago" },
  { id: "3", who: "Mike", what: "reached Silver League", icon: "/rank-bronze.png", t: "32m ago" },
  { id: "4", who: "Zara", what: "captured a Cosmic Axol", icon: "/sprites/cosmetics/cosmic-bird.png", t: "1h ago" },
  { id: "5", who: "AxolMaster", what: "achieved 10 win streak", icon: "/icon-arena.png", t: "2h ago" },
];
