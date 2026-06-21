import type { TrainerProfile } from "./profile";
import { applyTrophyDelta, normalizeProfile } from "./profile";

/** Gameplay actions that grant trainer XP and activity tickets. */
export type ProgressEvent =
  | "battle_win"
  | "battle_loss"
  | "hatch"
  | "breed"
  | "feed"
  | "power_up"
  | "solaxy_level_up"
  | "quest_complete"
  | "market_purchase"
  | "energy_refill"
  | "dna_bonus";

export const TRAINER_XP: Record<ProgressEvent, number> = {
  battle_win: 40,
  battle_loss: 15,
  hatch: 25,
  breed: 50,
  feed: 15,
  power_up: 35,
  solaxy_level_up: 20,
  quest_complete: 30,
  market_purchase: 0,
  energy_refill: 10,
  dna_bonus: 5,
};

export const ACTIVITY_TICKETS: Record<ProgressEvent, number> = {
  battle_win: 8,
  battle_loss: 2,
  hatch: 6,
  breed: 10,
  feed: 3,
  power_up: 5,
  solaxy_level_up: 4,
  quest_complete: 15,
  market_purchase: 0,
  energy_refill: 2,
  dna_bonus: 1,
};

export const TROPHY_WIN = 8;
export const TROPHY_LOSS = 6;

/** Trainer level curve — separate from Solaxy XP. */
export function trainerXpToNext(level: number): number {
  return 100 + Math.max(0, level - 1) * 75;
}

export function marketTicketBonus(solaxBurned: number): number {
  if (solaxBurned <= 0) return 0;
  return Math.max(1, Math.floor(solaxBurned / 25_000));
}

export function marketXpBonus(solaxBurned: number): number {
  if (solaxBurned <= 0) return 0;
  return Math.max(5, Math.floor(solaxBurned / 20_000));
}

export function applyTrainerXp(profile: TrainerProfile, amount: number): TrainerProfile {
  if (amount <= 0) return profile;
  let xp = profile.xp + amount;
  let level = profile.level;
  let xpToNext = trainerXpToNext(level);
  while (xp >= xpToNext && level < 99) {
    xp -= xpToNext;
    level += 1;
    xpToNext = trainerXpToNext(level);
  }
  return { ...profile, xp, level, xpToNext };
}

export function addActivityTickets(profile: TrainerProfile, amount: number): TrainerProfile {
  if (amount <= 0) return profile;
  return { ...profile, activityTickets: (profile.activityTickets ?? 0) + amount };
}

export function applyProgressEvent(
  profile: TrainerProfile,
  event: ProgressEvent,
  solaxBurned = 0,
): TrainerProfile {
  let next = profile;
  const xpGain = TRAINER_XP[event] + (event === "market_purchase" ? marketXpBonus(solaxBurned) : 0);
  const ticketGain = ACTIVITY_TICKETS[event] + (event === "market_purchase" ? marketTicketBonus(solaxBurned) : 0);

  if (event === "battle_win") next = applyTrophyDelta(next, TROPHY_WIN);
  else if (event === "battle_loss") next = applyTrophyDelta(next, -TROPHY_LOSS);

  next = applyTrainerXp(next, xpGain);
  next = addActivityTickets(next, ticketGain);
  return normalizeProfile(next);
}

/** Grant trainer rewards for each Solaxy level gained during feed/battle XP. */
export function applySolaxyLevelUps(profile: TrainerProfile, levelsGained: number): TrainerProfile {
  let next = profile;
  for (let i = 0; i < levelsGained; i++) {
    next = applyProgressEvent(next, "solaxy_level_up");
  }
  return next;
}

export function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function dailyQuestsComplete(quests: { wins: number; rolls: number; breeds: number }): boolean {
  return quests.wins >= 3 && quests.rolls >= 1 && quests.breeds >= 1;
}
