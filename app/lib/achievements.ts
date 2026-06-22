import type { Axol, AxolClass } from "./game";
import { CLASSIFIED_CLASSES, CLASS_META, RARITY_META } from "./game";
import type { BattleHistoryEntry, TrainerProfile } from "./profile";
import { dexProgress } from "./dex-catalog";

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: string;
};

export type AchievementContext = {
  profile: TrainerProfile;
  axols: Axol[];
  battleHistory: BattleHistoryEntry[];
  quests: { rolls: number; breeds: number; wins: number };
  totalSunk?: number;
};

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const { profile, axols, battleHistory, quests } = ctx;
  const wins = battleHistory.filter((b) => b.win).length || quests.wins;
  const losses = battleHistory.filter((b) => !b.win).length;
  const cosmic = axols.filter((a) => a.rarity === "Cosmic").length;
  const classified = axols.filter((a) => CLASSIFIED_CLASSES.includes(a.cls)).length;
  const maxLevel = axols.length ? Math.max(...axols.map((a) => a.level)) : 0;
  const maxGen = axols.length ? Math.max(...axols.map((a) => a.generation)) : 0;
  const dex = dexProgress(axols);
  const dexPct = dex.total ? Math.round((dex.unlocked / dex.total) * 100) : 0;
  const tickets = profile.activityTickets ?? 0;

  const has = (cond: boolean) => cond;

  return [
    {
      id: "first-hatch",
      title: "First Hatch",
      desc: "Hatch your first Solaxy at the DNA Core.",
      icon: "/icons/dna.png",
      color: "#a779ff",
      unlocked: has(axols.length >= 1),
    },
    {
      id: "cosmic-pull",
      title: "Cosmic Witness",
      desc: "Own a Cosmic Solaxy.",
      icon: "/egg-cosmic.png",
      color: "#c46bff",
      unlocked: has(cosmic >= 1),
      progress: cosmic ? `${cosmic} owned` : undefined,
    },
    {
      id: "classified",
      title: "Classified Clearance",
      desc: "Obtain a Season 1 Classified Solaxy.",
      icon: "/sprites/dex/unreleased-mirage.png",
      color: "#ff9df5",
      unlocked: has(classified >= 1),
      progress: classified ? `${classified} classified` : undefined,
    },
    {
      id: "arena-10",
      title: "Arena Contender",
      desc: "Win 10 Arena battles.",
      icon: "/icon-arena.png",
      color: "#54e07a",
      unlocked: has(wins >= 10),
      progress: `${wins}/10 wins`,
    },
    {
      id: "arena-50",
      title: "Battle Veteran",
      desc: "Win 50 Arena battles.",
      icon: "/icon-arena.png",
      color: "#3db4ff",
      unlocked: has(wins >= 50),
      progress: `${wins}/50 wins`,
    },
    {
      id: "breeder",
      title: "Nursery Keeper",
      desc: "Breed 5 Solaxies.",
      icon: "/icons/egg.png",
      color: "#ff7ad1",
      unlocked: has(quests.breeds >= 5),
      progress: `${quests.breeds}/5 breeds`,
    },
    {
      id: "gen-3",
      title: "Lineage Builder",
      desc: "Raise a Gen 3+ Solaxy.",
      icon: "/icon-nursery.png",
      color: "#ffd24a",
      unlocked: has(maxGen >= 3),
      progress: maxGen ? `Gen ${maxGen}` : "Gen 0",
    },
    {
      id: "power-30",
      title: "Power Trainer",
      desc: "Level a Solaxy to 30+.",
      icon: "/icon-shrine.png",
      color: "#ffb02e",
      unlocked: has(maxLevel >= 30),
      progress: maxLevel ? `Lv.${maxLevel}` : "Lv.0",
    },
    {
      id: "dex-half",
      title: "Dex Scholar",
      desc: "Discover 50% of the SolaxyDex.",
      icon: "/icon-collection.png",
      color: "#2fe0cf",
      unlocked: has(dexPct >= 50),
      progress: `${dexPct}%`,
    },
    {
      id: "dex-master",
      title: "Dex Master",
      desc: "Complete the playable SolaxyDex.",
      icon: "/icon-collection.png",
      color: "#54e07a",
      unlocked: has(dexPct >= 100),
      progress: `${dex.unlocked}/${dex.total}`,
    },
    {
      id: "tickets-1k",
      title: "Island Regular",
      desc: "Earn 1,000 activity tickets.",
      icon: "/icon-energy.png",
      color: "#c08bff",
      unlocked: has(tickets >= 1000),
      progress: `${tickets.toLocaleString()} tickets`,
    },
    {
      id: "gold-league",
      title: "Gold Rank",
      desc: "Reach Gold league in Arena.",
      icon: "/rank-bronze.png",
      color: "#ffd24a",
      unlocked: has(profile.trophies >= 1800),
      progress: profile.league,
    },
    {
      id: "trader",
      title: "Harbor Trader",
      desc: "List a Solaxy on the player market.",
      icon: "/icon-market.png",
      color: "#2fe0cf",
      unlocked: has(!!profile.appliedAirdrops?.includes("v13_listed")),
    },
    {
      id: "collector-20",
      title: "Pond Keeper",
      desc: "Own 20 Solaxies.",
      icon: "/icon-collection.png",
      color: "#ffa83d",
      unlocked: has(axols.length >= 20),
      progress: `${axols.length}/20`,
    },
    {
      id: "win-streak",
      title: "On Fire",
      desc: "Win 5 battles in a row.",
      icon: "/icons/coin.png",
      color: "#ff6b6b",
      unlocked: has(longestWinStreak(battleHistory) >= 5),
      progress: `${longestWinStreak(battleHistory)} streak`,
    },
  ];
}

function longestWinStreak(history: BattleHistoryEntry[]): number {
  let best = 0;
  let cur = 0;
  for (const b of [...history].reverse()) {
    if (b.win) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return best;
}

export function achievementSummary(achievements: Achievement[]): { unlocked: number; total: number } {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return { unlocked, total: achievements.length };
}

export function legendsFromAxols(axols: Axol[], wins: number): { title: string; name: string; detail: string; sprite: string; accent: string }[] {
  if (!axols.length) {
    return [
      { title: "Oldest", name: "—", detail: "—", sprite: "/sprites/beast.png", accent: "#ffa83d" },
      { title: "Highest Lv", name: "—", detail: "—", sprite: "/sprites/bird.png", accent: "#ff5fb0" },
      { title: "Most Wins", name: "—", detail: "—", sprite: "/icon-arena.png", accent: "#54e07a" },
      { title: "Rarest", name: "—", detail: "—", sprite: "/egg-cosmic.png", accent: "#c46bff" },
      { title: "Highest Gen", name: "—", detail: "—", sprite: "/sprites/plant.png", accent: "#54e07a" },
    ];
  }
  const oldest = [...axols].sort((a, b) => a.generation - b.generation || a.id - b.id)[0]!;
  const highest = [...axols].sort((a, b) => b.level - a.level)[0]!;
  const rarest = [...axols].sort((a, b) => RARITY_META[b.rarity].stars - RARITY_META[a.rarity].stars)[0]!;
  const highestGen = [...axols].sort((a, b) => b.generation - a.generation)[0]!;
  return [
    { title: "Oldest", name: CLASS_META[oldest.cls].name, detail: `Gen ${oldest.generation}`, sprite: CLASS_META[oldest.cls].sprite, accent: CLASS_META[oldest.cls].color },
    { title: "Highest Lv", name: highest.name, detail: `Lv.${highest.level}`, sprite: CLASS_META[highest.cls].sprite, accent: CLASS_META[highest.cls].color },
    { title: "Your Wins", name: String(wins), detail: "Arena", sprite: "/icon-arena.png", accent: "#54e07a" },
    { title: "Rarest", name: CLASS_META[rarest.cls].name, detail: rarest.rarity, sprite: CLASS_META[rarest.cls].sprite, accent: RARITY_META[rarest.rarity].color },
    { title: "Highest Gen", name: CLASS_META[highestGen.cls].name, detail: `Gen ${highestGen.generation}`, sprite: CLASS_META[highestGen.cls].sprite, accent: CLASS_META[highestGen.cls].color },
  ];
}
