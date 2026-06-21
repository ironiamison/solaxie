import type { Axol, Resources } from "./game";
import type { TrainerProfile } from "./profile";

/** One-time launch gift — tracked in profile so it never double-applies. */
export const LAUNCH_AIRDROP_ID = "2025-06-solax-live";

export const LAUNCH_AIRDROP = {
  eggs: 5,
  extraFreeBreedsPerWindow: 4,
  extraBreedCountPerAxol: 4,
} as const;

export function hasAirdrop(profile: TrainerProfile, id: string): boolean {
  return profile.appliedAirdrops?.includes(id) ?? false;
}

export function applyLaunchAirdrop(
  profile: TrainerProfile,
  resources: Resources,
  axols: Axol[],
): { profile: TrainerProfile; resources: Resources; axols: Axol[]; applied: boolean } {
  if (hasAirdrop(profile, LAUNCH_AIRDROP_ID)) {
    return { profile, resources, axols, applied: false };
  }

  return {
    profile: {
      ...profile,
      appliedAirdrops: [...(profile.appliedAirdrops ?? []), LAUNCH_AIRDROP_ID],
    },
    resources: {
      ...resources,
      eggs: resources.eggs + LAUNCH_AIRDROP.eggs,
    },
    axols: axols.map((a) => ({
      ...a,
      maxBreedCount: a.maxBreedCount + LAUNCH_AIRDROP.extraBreedCountPerAxol,
    })),
    applied: true,
  };
}
