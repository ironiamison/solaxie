import type { Axol, FeedItem, Resources } from "./game";
import type { BattleHistoryEntry, TrainerProfile } from "./profile";
import type { Quests } from "@/components/world/world";
import type { PondLayout } from "./pond-layout";
import type { PondLayouts } from "./pond-layouts";

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

function read(key: string): GameSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as GameSave;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

function write(key: string, data: GameSave) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
}

export function loadGuestSave(): GameSave | null {
  return read(GUEST_KEY);
}

export function loadWalletSave(fullAddress: string): GameSave | null {
  return read(walletKey(fullAddress));
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
