import type { Resources } from "./game";
import { normalizeItems } from "./harbor-items";
import { isDemoWallet } from "./demo-wallet";

/** Browser-only guest session — no wallet adapter, no saves, no burns. */
export const GUEST_SESSION_ID = "solaxie-guest-try";

export function isGuestSession(address: string | null | undefined): boolean {
  return !!address && address === GUEST_SESSION_ID;
}

export function isFreePlayMode(address: string | null | undefined): boolean {
  return isDemoWallet(address) || isGuestSession(address);
}

export const GUEST_RESOURCES: Resources = {
  solax: 250_000,
  dna: 80,
  eggs: 8,
  energy: 120,
  maxEnergy: 120,
  streak: 0,
  items: {
    luck: 3,
    epic: 2,
    legend: 1,
    cosmic: 0,
  },
};

export function applyGuestResources(resources: Resources): Resources {
  const items = { ...normalizeItems(resources.items) };
  for (const [k, v] of Object.entries(GUEST_RESOURCES.items ?? {})) {
    items[k] = Math.max(items[k] ?? 0, v);
  }
  return {
    ...resources,
    solax: Math.max(resources.solax, GUEST_RESOURCES.solax),
    dna: Math.max(resources.dna, GUEST_RESOURCES.dna),
    eggs: Math.max(resources.eggs, GUEST_RESOURCES.eggs),
    maxEnergy: Math.max(resources.maxEnergy, GUEST_RESOURCES.maxEnergy),
    energy: Math.max(resources.energy, GUEST_RESOURCES.energy),
    streak: Math.max(resources.streak, GUEST_RESOURCES.streak),
    items,
  };
}
