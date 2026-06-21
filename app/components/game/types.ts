import type { PublicKey } from "@solana/web3.js";
import type { AxolView } from "@/components/AxolCard";

export type PlayerView = {
  name: string;
  energy: number;
  battlesWon: number;
  battlesLost: number;
};

export type TabId = "home" | "collection" | "battle" | "market" | "empire";

/** Everything the game screens need: live on-chain data + actions, owned by the page. */
export type GameApi = {
  publicKey: PublicKey | null;
  player: PlayerView | null;
  tokenBalance: number;
  myAxols: AxolView[];
  allAxols: AxolView[];
  totals: { axols: number; battles: number };
  loading: boolean;
  busy: string | null;

  tab: TabId;
  setTab: (t: TabId) => void;

  selectedId: number | null;
  setSelectedId: (id: number | null) => void;

  // actions
  mintAxol: () => Promise<void>;
  breed: (aId: number, bId: number) => Promise<void>;
  battle: (myId: number, oppId: number) => Promise<void>;
  comingSoon: (label: string) => void;

  openBreed: () => void;
};

export const MAX_ENERGY = 100;
