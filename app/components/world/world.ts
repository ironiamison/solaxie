import type { Axol, BattleResult, FeedItem, Resources } from "@/lib/game";
import type { AvatarId, BattleHistoryEntry, TrainerProfile } from "@/lib/profile";
import type { PublicPlayer } from "@/lib/public-player";
import type { PondLayout, PondSpotPct } from "@/lib/pond-layout";
import type { PondLayouts } from "@/lib/pond-layouts";

import type { FriendRow } from "@/lib/marketplace";

export type Screen = "home" | "collection" | "battle" | "market" | "dnacore" | "empire" | "settings";

export type Quests = { rolls: number; breeds: number; wins: number; claimedDay?: string };

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
  doBreed: (a: number, b: number, solaxCost?: number) => Promise<Axol | null>;
  doBattle: (myId: number, enemy?: Axol) => Promise<{ mine: Axol; enemy: Axol; result: BattleResult } | null>;

  /** Visit another trainer's public Empire Hall. */
  visitEmpire: (wallet: string) => void;
  /** Return to your own empire from a visited profile. */
  closeVisitedEmpire: () => void;
  viewingPlayer: PublicPlayer | null;
  openLeaderboard: () => void;

  /** Spend SOLAX or SPL (when itemId set). Returns false if too poor or tx fails. */
  purchase: (price: number, reward?: Partial<Resources>, label?: string, itemId?: string) => Promise<boolean>;
  addAxol: (a: Axol) => void;
  /** Permanently remove a Solaxy from your collection. Returns false if blocked. */
  releaseAxol: (id: number) => boolean;
  feedAxol: (id: number) => Promise<boolean>;
  powerUp: (id: number) => Promise<boolean>;
  /** Buy `blocks` × 10 energy at 100k SOLAX each (burned). Returns false if too poor. */
  buyEnergy: (blocks: number) => Promise<boolean>;
  setActive: (id: number) => void;
  toast: (msg: string, opts?: { critical?: boolean }) => void;
  /** Force-refresh on-chain SOLAX balance into the HUD. */
  refreshSolax: () => Promise<number>;
  /** Track global SOLAX sunk (spent = burned for every in-game sink). */
  recordEconomy: (amount: number) => void;
  /** Unix ms — last free DNA bonus claim (undefined = never claimed). */
  lastDnaBonusAt?: number;
  /** Claim +5 DNA if the 4-hour cooldown has elapsed. */
  claimDnaBonus: () => boolean;
  /** Drag-to-arrange pond positions (separate for home island vs collection preview). */
  pondLayouts: PondLayouts;
  pondArranging: boolean;
  pondArrangeView: "home" | "collection" | null;
  openPondArrange: (view: "home" | "collection") => void;
  closePondArrange: () => void;
  setPondSpot: (axolId: number, spot: PondSpotPct) => void;
  spendDna: (amount: number) => boolean;
  /** Consume one harbor booster per key (luck, epic, …). */
  consumeHarborItems: (keys: string[]) => boolean;
  resetPondLayout: () => void;
  /** True when the Anchor program is deployed — core loop uses on-chain txs. */
  chainReady: boolean;
  /** Deployer demo wallet — unlimited resources, no burns. */
  demoMode: boolean;
  /** v1.3 — followed trainers. */
  friends: FriendRow[];
  followTrainer: (targetWallet: string, action?: "follow" | "unfollow") => Promise<boolean>;
  /** List a Solaxy on the player market (listing fee burned). */
  listSolaxyForSale: (axolId: number, priceSolax: number) => Promise<boolean>;
  /** Buy a listed Solaxy (price + tax burned). */
  buyMarketListing: (listingId: string, priceSolax: number) => Promise<boolean>;
  /** Direct Arena challenge against a trainer (friend duel). */
  challengeTrainer: (wallet: string) => Promise<boolean>;
  /** Clears pending challenge after battle starts or is cancelled. */
  clearChallenge: () => void;
  pendingChallenge: import("@/lib/public-player").BattleOpponentPayload | null;
  /** Class filters for Player Market watch alerts. */
  marketWatches: import("@/lib/game").AxolClass[];
  toggleMarketWatch: (cls: import("@/lib/game").AxolClass) => void;
  /** Check dex line completion rewards after roster changes. */
  checkDexRewards: () => void;
};
