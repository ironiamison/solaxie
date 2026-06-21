import type { Axol, Resources } from "./game";
import { eventMaxEnergy } from "./game";
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

/** One-time fix for saves that synced 0 eggs — restocks the Nursery for active breeders. */
export const EGG_RECOVERY_AIRDROP_ID = "2025-06-egg-recovery";
const EGG_RECOVERY_TARGET = 8;

export function applyEggRecoveryAirdrop(
  profile: TrainerProfile,
  resources: Resources,
  axols: Axol[],
): { profile: TrainerProfile; resources: Resources; axols: Axol[]; applied: boolean } {
  if (hasAirdrop(profile, EGG_RECOVERY_AIRDROP_ID)) {
    return { profile, resources, axols, applied: false };
  }
  if (axols.length < 2 || resources.eggs >= 3) {
    return { profile, resources, axols, applied: false };
  }

  return {
    profile: {
      ...profile,
      appliedAirdrops: [...(profile.appliedAirdrops ?? []), EGG_RECOVERY_AIRDROP_ID],
    },
    resources: {
      ...resources,
      eggs: Math.max(resources.eggs, EGG_RECOVERY_TARGET),
    },
    axols,
    applied: true,
  };
}

/** One-time global energy top-up for all trainers on login. */
export const ENERGY_REFILL_AIRDROP_ID = "2025-06-energy-refill";

export function applyEnergyRefillAirdrop(
  profile: TrainerProfile,
  resources: Resources,
): { profile: TrainerProfile; resources: Resources; applied: boolean } {
  if (hasAirdrop(profile, ENERGY_REFILL_AIRDROP_ID)) {
    return { profile, resources, applied: false };
  }

  const maxEnergy = eventMaxEnergy();
  return {
    profile: {
      ...profile,
      appliedAirdrops: [...(profile.appliedAirdrops ?? []), ENERGY_REFILL_AIRDROP_ID],
    },
    resources: {
      ...resources,
      maxEnergy,
      energy: maxEnergy,
    },
    applied: true,
  };
}
