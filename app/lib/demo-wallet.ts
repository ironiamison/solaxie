import type { Resources } from "./game";
import { normalizeItems } from "./harbor-items";

/** Deployer wallet — unlimited off-chain resources, no SOLAX burns (demo / recording). */
export const DEMO_WALLET = "Hd6svrmaviybBM6tKtqsaxEZYBGRXTEhT7ZwPD3BSEpo";

export function isDemoWallet(address: string | null | undefined): boolean {
  return !!address && address === DEMO_WALLET;
}

export const DEMO_RESOURCES: Resources = {
  solax: 999_999_999,
  dna: 99_999,
  eggs: 999,
  energy: 99_999,
  maxEnergy: 99_999,
  streak: 999,
  items: {
    luck: 99,
    epic: 99,
    legend: 99,
    cosmic: 99,
  },
};

/** Top up resources to demo floors (keeps roster / layout from save). */
export function applyDemoResources(resources: Resources): Resources {
  const items = { ...normalizeItems(resources.items) };
  for (const [k, v] of Object.entries(DEMO_RESOURCES.items ?? {})) {
    items[k] = Math.max(items[k] ?? 0, v);
  }
  return {
    ...resources,
    solax: Math.max(resources.solax, DEMO_RESOURCES.solax),
    dna: Math.max(resources.dna, DEMO_RESOURCES.dna),
    eggs: Math.max(resources.eggs, DEMO_RESOURCES.eggs),
    maxEnergy: Math.max(resources.maxEnergy, DEMO_RESOURCES.maxEnergy),
    energy: Math.max(resources.energy, DEMO_RESOURCES.energy),
    streak: Math.max(resources.streak, DEMO_RESOURCES.streak),
    items,
  };
}
