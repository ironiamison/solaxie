import type { Axol, BattleResult, FeedItem, Resources } from "@/lib/game";
import type { AvatarId, BattleHistoryEntry, TrainerProfile } from "@/lib/profile";

export type Screen = "home" | "collection" | "battle" | "market" | "dnacore" | "empire";

export type Quests = { rolls: number; breeds: number; wins: number };

/** Shared game state + actions handed to every screen by the page. */
export type WorldApi = {
  axols: Axol[];
  resources: Resources;
  feed: FeedItem[];
  quests: Quests;
  wallet: string | null;
  walletAddress: string | null;
  loggedIn: boolean;
  connecting: boolean;
  purchasing: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  activeId: number | null;

  profile: TrainerProfile;
  needsUsername: boolean;
  setUsername: (name: string) => void;
  setAvatarId: (id: AvatarId) => void;
  setEmpireName: (name: string) => void;
  battleHistory: BattleHistoryEntry[];
  recordBattle: (entry: Omit<BattleHistoryEntry, "id">) => void;
  /** Broadcast an action to the global live feed. */
  announceFeed: (what: string, color?: string) => void;

  screen: Screen;
  setScreen: (s: Screen) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  openBreed: () => void;

  doRoll: (luck?: number) => Promise<Axol | null>;
  doBreed: (a: number, b: number, extraFee?: number) => Promise<Axol | null>;
  doBattle: (myId: number) => Promise<{ mine: Axol; enemy: Axol; result: BattleResult } | null>;

  /** Spend SOLAX or SPL (when itemId set). Returns false if too poor or tx fails. */
  purchase: (price: number, reward?: Partial<Resources>, label?: string, itemId?: string) => Promise<boolean>;
  addAxol: (a: Axol) => void;
  feedAxol: (id: number) => boolean;
  powerUp: (id: number) => boolean;
  /** Buy `blocks` × 10 energy at 100k SOLAX each. Returns false if too poor. */
  buyEnergy: (blocks: number) => boolean;
  setActive: (id: number) => void;
  toast: (msg: string) => void;
};
