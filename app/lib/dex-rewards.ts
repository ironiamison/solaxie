import type { Axol, AxolClass } from "./game";
import { CLASS_META, CLASSES } from "./game";
import { dexEntriesForLine, unlockedDexIds } from "./dex-catalog";
import type { TrainerProfile } from "./profile";
import { hasAirdrop } from "./airdrops";

export const DEX_LINE_REWARD = {
  eggs: 2,
  activityTickets: 120,
} as const;

export function dexCompleteRewardId(cls: AxolClass): string {
  return `dex_complete_${cls}`;
}

/** True when every catalog form for this element line is unlocked. */
export function isDexLineComplete(cls: AxolClass, axols: Axol[]): boolean {
  const entries = dexEntriesForLine(cls);
  if (!entries.length) return false;
  const unlocked = unlockedDexIds(axols);
  return entries.every((e) => unlocked.has(e.id));
}

export type DexRewardGrant = {
  cls: AxolClass;
  rewardId: string;
  eggs: number;
  activityTickets: number;
};

/** Lines newly completed since last check — skips already-granted rewards. */
export function pendingDexRewards(profile: TrainerProfile, axols: Axol[]): DexRewardGrant[] {
  const out: DexRewardGrant[] = [];
  for (const cls of CLASSES) {
    const rewardId = dexCompleteRewardId(cls);
    if (hasAirdrop(profile, rewardId)) continue;
    if (!isDexLineComplete(cls, axols)) continue;
    out.push({
      cls,
      rewardId,
      eggs: DEX_LINE_REWARD.eggs,
      activityTickets: DEX_LINE_REWARD.activityTickets,
    });
  }
  return out;
}

export function formatDexRewardToast(grants: DexRewardGrant[]): string {
  if (grants.length === 1) {
    const g = grants[0];
    return `Dex complete: ${CLASS_META[g.cls].name}! +${g.eggs} eggs · +${g.activityTickets} tickets`;
  }
  return `Dex complete: ${grants.map((g) => CLASS_META[g.cls].name).join(", ")}!`;
}
