import type { AxolClass } from "./game";

export type AvatarId = AxolClass;

export type BattleHistoryEntry = {
  id: number;
  opponent: string;
  win: boolean;
  axolName: string;
  axolCls: AxolClass;
  rewardSolax: number;
  rewardXp: number;
  trophiesDelta: number;
  at: string;
};

export type TrainerProfile = {
  name: string;
  empireName: string;
  avatarId: AvatarId;
  level: number;
  xp: number;
  xpToNext: number;
  league: string;
  trophies: number;
  leagueMax: number;
  rank: number;
  chestWins: number;
  chestTarget: number;
  chestLevel: number;
};

export const DEFAULT_PROFILE: TrainerProfile = {
  name: "SolanaKid",
  empireName: "SolanaKid Empire",
  avatarId: "bird",
  level: 7,
  xp: 680,
  xpToNext: 1000,
  league: "Bronze III",
  trophies: 1254,
  leagueMax: 1600,
  rank: 124,
  chestWins: 6,
  chestTarget: 10,
  chestLevel: 8,
};

/** Circular PFP portraits — one per base class. */
export const PFP_AVATARS: Record<AvatarId, { src: string; label: string; ring: string }> = {
  plant: { src: "/pfp-plant.png", label: "Plant", ring: "#54e07a" },
  bug: { src: "/pfp-bug.png", label: "Bug", ring: "#a779ff" },
  bird: { src: "/pfp-bird.png", label: "Bird", ring: "#ff5fb0" },
  aquatic: { src: "/pfp-aquatic.png", label: "Aquatic", ring: "#3db4ff" },
  beast: { src: "/pfp-beast.png", label: "Beast", ring: "#ffa83d" },
  reptile: { src: "/pfp-reptile.png", label: "Reptile", ring: "#ffd24a" },
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
