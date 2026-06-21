import type { Axol } from "./game";
import type { AvatarId, TrainerProfile } from "./profile";

/** Public snapshot synced to the global registry (all players). */
export type PublicPlayer = {
  wallet: string;
  name: string;
  empireName: string;
  avatarId: AvatarId;
  level: number;
  league: string;
  trophies: number;
  rank: number;
  /** Season participation score — all island activity. */
  activityTickets: number;
  wins: number;
  axols: Axol[];
  activeId: number | null;
  updatedAt: number;
};

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  name: string;
  trophies: number;
  avatar: string;
  league: string;
  you?: boolean;
};

export type BattleOpponentPayload = {
  player: PublicPlayer;
  champion: Axol;
  isReal: boolean;
};

export function avatarForPlayer(p: Pick<PublicPlayer, "avatarId">): string {
  const map: Record<AvatarId, string> = {
    plant: "/pfp-plant.png",
    bug: "/pfp-bug.png",
    bird: "/pfp-bird.png",
    aquatic: "/pfp-aquatic.png",
    beast: "/pfp-beast.png",
    reptile: "/pfp-reptile.png",
    crystal: "/sprites/crystal.png",
    shadow: "/sprites/shadow.png",
    mech: "/sprites/mech.png",
    ember: "/sprites/ember.png",
    void: "/sprites/void.png",
  };
  return map[p.avatarId] ?? "/avatar-axolotl.png";
}

export function pickChampion(p: PublicPlayer): Axol | null {
  if (!p.axols.length) return null;
  if (p.activeId != null) {
    const active = p.axols.find((a) => a.id === p.activeId);
    if (active) return active;
  }
  return [...p.axols].sort((a, b) => b.level - a.level)[0];
}

export function battleTeam(p: PublicPlayer, limit = 5): Axol[] {
  return [...p.axols].sort((a, b) => b.level - a.level).slice(0, limit);
}

export function leaderboardRefreshLabel(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms = Math.max(0, next.getTime() - now.getTime());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export type PlayerSyncPayload = {
  wallet: string;
  profile: TrainerProfile;
  axols: Axol[];
  activeId: number | null;
  quests: { wins: number };
};

export function toPublicPlayer(payload: PlayerSyncPayload): PublicPlayer {
  const p = payload.profile;
  return {
    wallet: payload.wallet,
    name: p.name.trim() || "Trainer",
    empireName: p.empireName.trim() || `${p.name || "Trainer"} Empire`,
    avatarId: p.avatarId,
    level: p.level,
    league: p.league,
    trophies: p.trophies,
    rank: p.rank,
    activityTickets: p.activityTickets ?? 0,
    wins: payload.quests.wins,
    axols: payload.axols.slice(0, 40),
    activeId: payload.activeId,
    updatedAt: Date.now(),
  };
}
