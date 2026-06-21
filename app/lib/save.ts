import type { Axol, Resources } from "./game";
import type { BattleHistoryEntry, TrainerProfile } from "./profile";
import type { Quests } from "@/components/world/world";
import type { PondLayout } from "./pond-layout";
import type { PondLayouts } from "./pond-layouts";
import { STARTING_RESOURCES } from "./game";

export function shortAddr(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/** @deprecated Mock wallet — real wallets use the connected public key. */
export const MOCK_WALLET_FULL = "39JWk7HxR4mP8vC2nqL9tw6f";
export const MOCK_WALLET_DISPLAY = "39JW…tw6f";

const SAVE_VERSION = 3;
const GUEST_KEY = "solaxie_save_v3_guest";
const LAST_WALLET_KEY = "solaxie_last_wallet";

export type GameSave = {
  version: number;
  axols: Axol[];
  resources: Resources;
  profile: TrainerProfile;
  quests: Quests;
  battleHistory: BattleHistoryEntry[];
  activeId: number | null;
  selectedId: number | null;
  battleIdCounter: number;
  idCounter: number;
  /** Unix ms — last free DNA bonus claim in DNA Core. */
  lastDnaBonusAt?: number;
  /** Saved drag positions for pond Solaxies per screen. */
  pondLayouts?: PondLayouts;
  /** @deprecated Migrated to pondLayouts */
  pondLayout?: PondLayout;
  savedAt: number;
};

function walletKey(full: string) {
  return `solaxie_save_v3_${full}`;
}

function legacyWalletKeys(full: string): string[] {
  return [
    walletKey(full),
    `solaxie_save_v2_${full}`,
    `solaxie_save_${full}`,
  ];
}

function normalizeStoredResources(r: Partial<Resources> | undefined): Resources {
  const items = r?.items && typeof r.items === "object" ? r.items : {};
  return {
    ...STARTING_RESOURCES,
    ...r,
    items,
  };
}

/** Upgrade any stored save shape to v3. */
export function migrateGameSave(raw: Record<string, unknown>): GameSave | null {
  if (!raw || typeof raw !== "object") return null;
  const axols = Array.isArray(raw.axols) ? (raw.axols as Axol[]) : null;
  if (!axols) return null;
  const profile = raw.profile as TrainerProfile | undefined;
  if (!profile || typeof profile !== "object") return null;

  return {
    version: SAVE_VERSION,
    axols,
    resources: normalizeStoredResources(raw.resources as Partial<Resources> | undefined),
    profile,
    quests: (raw.quests as Quests) ?? { rolls: 0, breeds: 0, wins: 0 },
    battleHistory: Array.isArray(raw.battleHistory) ? (raw.battleHistory as BattleHistoryEntry[]) : [],
    activeId: typeof raw.activeId === "number" ? raw.activeId : null,
    selectedId: typeof raw.selectedId === "number" ? raw.selectedId : null,
    battleIdCounter: typeof raw.battleIdCounter === "number" ? raw.battleIdCounter : 1,
    idCounter: typeof raw.idCounter === "number" ? raw.idCounter : axols.length + 1,
    lastDnaBonusAt: typeof raw.lastDnaBonusAt === "number" ? raw.lastDnaBonusAt : undefined,
    pondLayouts: raw.pondLayouts as PondLayouts | undefined,
    pondLayout: raw.pondLayout as PondLayout | undefined,
    savedAt: typeof raw.savedAt === "number" ? raw.savedAt : Date.now(),
  };
}

function read(key: string): GameSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return migrateGameSave(data);
  } catch {
    return null;
  }
}

function write(key: string, data: GameSave) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() }));
}

export function loadGuestSave(): GameSave | null {
  return read(GUEST_KEY);
}

export function loadWalletSave(fullAddress: string): GameSave | null {
  for (const key of legacyWalletKeys(fullAddress)) {
    const save = read(key);
    if (save) {
      // Migrate forward to v3 key so legacy slots aren't relied on forever.
      if (key !== walletKey(fullAddress)) write(walletKey(fullAddress), save);
      return save;
    }
  }
  return null;
}

export function saveGuest(data: GameSave) {
  write(GUEST_KEY, data);
}

export function saveWallet(fullAddress: string, data: GameSave) {
  write(walletKey(fullAddress), data);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_WALLET_KEY, fullAddress);
  }
}

export function getLastWallet(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_WALLET_KEY);
}

export function clearLastWallet() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_WALLET_KEY);
}

export function buildSave(snapshot: Omit<GameSave, "version" | "savedAt">): GameSave {
  return { version: SAVE_VERSION, savedAt: Date.now(), ...snapshot };
}
