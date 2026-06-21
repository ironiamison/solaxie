import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Head from "next/head";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Axol,
  BattleResult,
  CLASS_META,
  COSTS,
  DNA_BONUS,
  ON_CHAIN_COSTS,
  ENERGY_REFILL,
  FeedItem,
  Resources,
  STARTING_RESOURCES,
  applyEnergyEvent,
  breedAxol,
  dnaBonusRemaining,
  energyBoostRemaining,
  feedCost,
  feedItem,
  feedXp,
  formatCooldown,
  getIdCounter,
  isEnergyBoostActive,
  powerUpCost,
  primeIds,
  randomAxol,
  resolveBattle,
  rollRarity,
  seedAxols,
  setIdCounter,
  wildAxol,
  withCosmetic,
  xpNeeded,
} from "@/lib/game";
import { MARKET_ITEM_EFFECTS, normalizeItems } from "@/lib/harbor-items";
import {
  buildSave,
  loadWalletSave,
  saveWallet,
  clearLastWallet,
  shortAddr,
  type GameSave,
} from "@/lib/save";
import { createChainClient } from "@/lib/chain";
import { fetchCloudSave, postCloudSave } from "@/lib/cloud-save";
import type { CloudSave } from "@/lib/cloud-save-store";
import { fetchGlobalFeed, postGlobalFeed } from "@/lib/global-feed";
import { recordEconomy as postEconomyStats } from "@/lib/global-stats";
import { fetchPublicPlayer, syncPublicPlayer } from "@/lib/global-players";
import { trainerProfileFromPublic } from "@/lib/public-player";
import { sfx } from "@/lib/sfx";
import { BreedModal, UsernameModal } from "@/components/world/modals";
import { SpendBurnMeter } from "@/components/world/SpendBurnMeter";
import { PondLayer } from "@/components/world/PondLayer";
import { PondArrangeOverlay } from "@/components/world/PondArrangeOverlay";
import {
  EMPTY_POND_LAYOUTS,
  layoutForView,
  normalizePondLayouts,
  resetLayoutView,
  setLayoutSpot,
  type PondLayouts,
} from "@/lib/pond-layouts";
import { LeaderboardModal } from "@/components/world/LeaderboardPanel";
import { TwitterLink } from "@/components/world/TwitterLink";
import { avatarSrc } from "@/lib/profile";
import type { PublicPlayer } from "@/lib/public-player";
import type { PondLayout, PondSpotPct } from "@/lib/pond-layout";
import Atmosphere from "@/components/world/Atmosphere";
import type { Screen, WorldApi, Quests } from "@/components/world/world";
import CollectionScreen from "@/components/world/screens/CollectionScreen";
import DnaCoreScreen from "@/components/world/screens/DnaCoreScreen";
import ArenaScreen from "@/components/world/screens/ArenaScreen";
import MarketScreen from "@/components/world/screens/MarketScreen";
import EmpireScreen from "@/components/world/screens/EmpireScreen";
import SettingsScreen from "@/components/world/screens/SettingsScreen";
import { notificationsEnabled } from "@/components/world/screens/SettingsScreen";
import TutorialScreen from "@/components/world/screens/TutorialScreen";
import { ConnectWalletModal } from "@/components/world/ConnectWalletModal";
import { ProfileDropdown } from "@/components/world/ProfileDropdown";
import type { AvatarId, BattleHistoryEntry, TrainerProfile } from "@/lib/profile";
import { STARTER_PROFILE, needsUsername, normalizeProfile, formatTrainerName } from "@/lib/profile";
import { applyEggRecoveryAirdrop, applyEnergyRefillAirdrop, applyLaunchAirdrop } from "@/lib/airdrops";
import {
  transferSolaxToBurnWallet,
  verifySolaxBurnTransfer,
} from "@/lib/solax-burn";
import { fetchWalletSolaxBalance, resolveSolaxTokenAccount } from "@/lib/wallet-balance";
import { PublicKey, type Connection } from "@solana/web3.js";
import {
  applyProgressEvent,
  applySolaxyLevelUps,
  dailyQuestsComplete,
  utcDayKey,
  type ProgressEvent,
} from "@/lib/progression";

/** On-chain SOLAX read via the connected wallet RPC (most reliable in-browser). */
async function readOnChainSolax(connection: Connection, owner: PublicKey): Promise<number> {
  return fetchWalletSolaxBalance(connection, owner).catch(() => 0);
}

/** HUD balance — wallet RPC first; API backup; never trust a zero over a known positive balance. */
async function readSolaxBalance(
  connection: Connection,
  owner: PublicKey,
  floor = 0,
): Promise<number> {
  const clientBal = await readOnChainSolax(connection, owner);
  let fromApi = 0;
  try {
    const res = await fetch(`/api/balance?wallet=${owner.toBase58()}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { solax?: number };
      if (typeof data.solax === "number") fromApi = data.solax;
    }
  } catch {
    // API optional
  }
  return Math.max(clientBal, fromApi, floor);
}

function pickMostAxols(...lists: (Axol[] | undefined)[]): Axol[] {
  const best = lists.filter((l) => l && l.length > 0).sort((a, b) => b!.length - a!.length)[0];
  return best ?? [];
}

function maxOffChainConsumables(a: Resources, b: Resources): Pick<Resources, "eggs" | "dna" | "energy"> {
  return {
    eggs: Math.max(a.eggs ?? 0, b.eggs ?? 0),
    dna: Math.max(a.dna ?? 0, b.dna ?? 0),
    energy: Math.max(a.energy ?? 0, b.energy ?? 0),
  };
}

function mergeOffChainResources(
  local: Resources | undefined,
  cloud: CloudSave["resources"] | undefined,
): Resources {
  if (local && cloud) {
    const localN = normalizeResources(local);
    const cloudN = normalizeResources({ ...STARTING_RESOURCES, ...cloud, solax: 0 });
    return normalizeResources({
      ...cloudN,
      ...localN,
      ...maxOffChainConsumables(localN, cloudN),
      items: { ...(cloud.items ?? {}), ...(local.items ?? {}) },
    });
  }
  if (local) return normalizeResources(local);
  if (cloud) return normalizeResources({ ...STARTING_RESOURCES, ...cloud, solax: 0 });
  return normalizeResources(STARTING_RESOURCES);
}

type Target = Screen | "breed";

type Building = {
  id: string;
  title: string;
  sub: string;
  icon: string;
  target: Target;
  accent: string;
  pos: { left: string; top: string };
  scale?: number;
  torches?: boolean;
  flags?: boolean;
  aura?: number;
};

const BUILDINGS: Building[] = [
  { id: "arena", title: "Arena Cave", sub: "Battle", icon: "/icon-arena.png", target: "battle", accent: "#b14bff", pos: { left: "17%", top: "31%" }, scale: 1.4, torches: true, flags: true, aura: 1 },
  { id: "shrine", title: "DNA Shrine", sub: "Roll", icon: "/icon-shrine.png", target: "dnacore", accent: "#a463ff", pos: { left: "13%", top: "64%" }, scale: 1.18, aura: 0.7 },
  { id: "nursery", title: "Nursery Tree", sub: "Breed", icon: "/icon-nursery.png", target: "breed", accent: "#ff5fb0", pos: { left: "77%", top: "17%" }, scale: 1.22, flags: true, aura: 0.6 },
  { id: "market", title: "Harbor Market", sub: "Shop", icon: "/icon-market.png", target: "market", accent: "#2fe0cf", pos: { left: "86%", top: "57%" }, scale: 1.2, flags: true, aura: 0.55 },
  { id: "empire", title: "Empire Hall", sub: "Ranks", icon: "/icon-empire.png", target: "empire", accent: "#ffb02e", pos: { left: "50%", top: "12%" }, scale: 1.2, flags: true, aura: 0.6 },
];

function loggedOutSave(): GameSave {
  return buildSave({
    axols: [],
    resources: { solax: 0, dna: 0, eggs: 0, energy: 0, maxEnergy: 100, streak: 0, items: {} },
    profile: STARTER_PROFILE,
    quests: { rolls: 0, breeds: 0, wins: 0 },
    battleHistory: [],
    activeId: null,
    selectedId: null,
    battleIdCounter: 1,
    idCounter: 1,
  });
}

function freshSave(): GameSave {
  const seed = seedAxols().map(withCosmetic);
  primeIds(seed);
  return buildSave({
    axols: seed,
    resources: STARTING_RESOURCES,
    profile: { ...STARTER_PROFILE },
    quests: { rolls: 0, breeds: 0, wins: 0 },
    battleHistory: [],
    activeId: seed[0]?.id ?? null,
    selectedId: seed[0]?.id ?? null,
    battleIdCounter: 1,
    idCounter: getIdCounter(),
  });
}

function normalizeResources(r: Resources): Resources {
  return applyEnergyEvent({
    ...STARTING_RESOURCES,
    ...r,
    items: normalizeItems(r.items),
  });
}

function applySave(
  save: GameSave,
  set: {
    setAxols: (v: Axol[]) => void;
    setResources: (v: Resources) => void;
    setProfile: (v: TrainerProfile) => void;
    setQuests: (v: Quests) => void;
    setBattleHistory: (v: BattleHistoryEntry[]) => void;
    setActiveId: (v: number | null) => void;
    setSelectedId: (v: number | null) => void;
    battleId: MutableRefObject<number>;
    setLastDnaBonusAt: (v: number | undefined) => void;
    setPondLayouts: (v: PondLayouts) => void;
  },
) {
  setIdCounter(save.idCounter);
  primeIds(save.axols);
  set.setAxols(save.axols.map(withCosmetic));
  set.setResources(normalizeResources(save.resources));
  set.setProfile(normalizeProfile(save.profile));
  set.setQuests(save.quests);
  set.setBattleHistory(save.battleHistory);
  set.setActiveId(save.activeId);
  set.setSelectedId(save.selectedId);
  set.setLastDnaBonusAt(save.lastDnaBonusAt);
  set.setPondLayouts(normalizePondLayouts(save.pondLayouts ?? save.pondLayout));
  set.battleId.current = save.battleIdCounter;
}

export default function World() {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    wallet: adapterWallet,
  } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const isLinked = connected && !!walletAddress;
  const [chainReady, setChainReady] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const chainClient = useMemo(() => {
    if (!publicKey || !adapterWallet?.adapter) return null;
    const adapter = adapterWallet.adapter;
    if (!adapter.publicKey || !("signTransaction" in adapter)) return null;
    return createChainClient(connection, adapter as AnchorWallet);
  }, [connection, publicKey, adapterWallet]);

  const [mounted, setMounted] = useState(false);
  const [axols, setAxols] = useState<Axol[]>([]);
  const [resources, setResources] = useState<Resources>(STARTING_RESOURCES);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [breedOpen, setBreedOpen] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletFull, setWalletFull] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const loadedWalletRef = useRef<string | null>(null);
  /** Blocks auto-save until wallet hydrate finishes — prevents wiping saves on connect. */
  const [saveReady, setSaveReady] = useState(false);
  const [profile, setProfile] = useState<TrainerProfile>(STARTER_PROFILE);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [battleHistory, setBattleHistory] = useState<BattleHistoryEntry[]>([]);
  const battleId = useRef(1);
  const [quests, setQuests] = useState<Quests>({ rolls: 0, breeds: 0, wins: 0 });
  const [lastDnaBonusAt, setLastDnaBonusAt] = useState<number | undefined>(undefined);
  const [pondLayouts, setPondLayouts] = useState<PondLayouts>(EMPTY_POND_LAYOUTS);
  const [pondArranging, setPondArranging] = useState(false);
  const [pondArrangeView, setPondArrangeView] = useState<"home" | "collection" | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState<PublicPlayer | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resourcesRef = useRef(resources);
  resourcesRef.current = resources;

  const toast = useCallback((msg: string, opts?: { critical?: boolean }) => {
    if (!opts?.critical && !notificationsEnabled()) return;
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const grantProgression = useCallback(
    (event: ProgressEvent, solaxBurned = 0, extraLevels = 0) => {
      setProfile((p) => {
        let next = applyProgressEvent(p, event, solaxBurned);
        if (extraLevels > 0) next = applySolaxyLevelUps(next, extraLevels);
        if (next.level > p.level) {
          queueMicrotask(() => toast(`Trainer level up! Now Lv.${next.level}`));
        }
        return next;
      });
    },
    [toast],
  );

  const tryCompleteDailyQuests = useCallback(
    (next: Quests) => {
      const day = utcDayKey();
      if (next.claimedDay === day || !dailyQuestsComplete(next)) return next;
      grantProgression("quest_complete");
      setResources((r) => ({ ...r, eggs: r.eggs + 1 }));
      toast("Daily quests complete! +1 egg · +activity tickets");
      return { rolls: 0, breeds: 0, wins: 0, claimedDay: day };
    },
    [grantProgression, toast],
  );

  const bumpQuest = useCallback(
    (key: keyof Pick<Quests, "rolls" | "breeds" | "wins">) => {
      setQuests((q) => {
        const day = utcDayKey();
        const base =
          q.claimedDay && q.claimedDay !== day
            ? { rolls: 0, breeds: 0, wins: 0, claimedDay: undefined }
            : q;
        const bumped = { ...base, [key]: base[key] + 1 };
        return tryCompleteDailyQuests(bumped);
      });
    },
    [tryCompleteDailyQuests],
  );

  /** Apply Solaxy XP and return how many levels were gained. */
  const solaxyXpGain = (axol: Axol, xpGain: number) => {
    let xp = axol.xp + xpGain;
    let level = axol.level;
    let levelsGained = 0;
    while (xp >= xpNeeded(level)) {
      xp -= xpNeeded(level);
      level += 1;
      levelsGained += 1;
    }
    return { xp, level, levelsGained };
  };

  const apply = (save: GameSave) =>
    applySave(save, { setAxols, setResources, setProfile, setQuests, setBattleHistory, setActiveId, setSelectedId, setLastDnaBonusAt, setPondLayouts, battleId });

  const snapshot = (): Omit<GameSave, "version" | "savedAt"> => ({
    axols,
    resources,
    profile,
    quests,
    battleHistory,
    activeId,
    selectedId,
    battleIdCounter: battleId.current,
    idCounter: getIdCounter(),
    lastDnaBonusAt,
    pondLayouts,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Surface wallet adapter errors as toasts.
  useEffect(() => {
    const onWalletError = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      toast(msg?.includes("User rejected") ? "Connection cancelled in wallet." : `Wallet error: ${msg}`);
    };
    window.addEventListener("solaxie-wallet-error", onWalletError);
    return () => window.removeEventListener("solaxie-wallet-error", onWalletError);
  }, [toast]);

  // Load save when wallet connects — chain axols + cloud profile/quests.
  useEffect(() => {
    if (!mounted || !isLinked || !walletAddress) return;
    if (loadedWalletRef.current === walletAddress) return;
    loadedWalletRef.current = walletAddress;
    setSaveReady(false);

    const walletSave = loadWalletSave(walletAddress);

    const hydrate = async () => {
      const [cloud, publicPlayer] = await Promise.all([
        fetchCloudSave(walletAddress),
        fetchPublicPlayer(walletAddress).catch(() => null),
      ]);

      const metaProfile =
        cloud?.profile ??
        walletSave?.profile ??
        (publicPlayer ? trainerProfileFromPublic(publicPlayer) : { ...STARTER_PROFILE });
      const metaQuestsRaw = cloud?.quests ?? walletSave?.quests ?? { rolls: 0, breeds: 0, wins: 0 };
      const day = utcDayKey();
      const metaQuests: Quests =
        metaQuestsRaw.claimedDay && metaQuestsRaw.claimedDay !== day
          ? { rolls: 0, breeds: 0, wins: 0 }
          : metaQuestsRaw;
      const metaHistory = cloud?.battleHistory ?? walletSave?.battleHistory ?? [];
      const metaActive = cloud?.activeId ?? walletSave?.activeId ?? publicPlayer?.activeId ?? null;
      const metaSelected = cloud?.selectedId ?? walletSave?.selectedId ?? metaActive;
      const metaDnaBonus = cloud?.lastDnaBonusAt ?? walletSave?.lastDnaBonusAt;
      const metaPond = cloud?.pondLayouts ?? walletSave?.pondLayouts ?? walletSave?.pondLayout;

      let profileDraft = metaProfile;
      let resourcesDraft = mergeOffChainResources(walletSave?.resources, cloud?.resources);
      let axolsDraft = pickMostAxols(
        walletSave?.axols,
        cloud?.axols,
        publicPlayer?.axols,
      ).map(withCosmetic);

      const hasSavedProgress =
        axolsDraft.length > 0 ||
        !!metaProfile.usernameSet ||
        (walletSave?.axols.length ?? 0) > 0 ||
        (cloud?.axols?.length ?? 0) > 0 ||
        (publicPlayer?.axols.length ?? 0) > 0;

      let ready = false;

      if (chainClient) {
        try {
          ready = await chainClient.isReady();
          setChainReady(ready);
          if (ready) {
            const trainerName = metaProfile.name?.trim() || "Trainer";
            await chainClient.ensurePlayer(trainerName);
            const state = await chainClient.refreshState();
            if (state.axols.length > 0) {
              axolsDraft = state.axols.map(withCosmetic);
            }
            resourcesDraft = normalizeResources({
              ...resourcesDraft,
              solax: state.solax,
              energy: Math.max(resourcesDraft.energy, state.energy),
            });
            if (state.axols.length > 0 && metaActive == null) {
              setActiveId(state.axols[0].id);
              setSelectedId(state.axols[0].id);
            }
          } else if (!hasSavedProgress) {
            const fresh = freshSave();
            profileDraft = fresh.profile;
            resourcesDraft = normalizeResources(fresh.resources);
            axolsDraft = fresh.axols.map(withCosmetic);
            primeIds(axolsDraft);
            battleId.current = fresh.battleIdCounter;
            if (fresh.activeId != null) {
              setActiveId(fresh.activeId);
              setSelectedId(fresh.selectedId);
            }
          } else if (walletSave) {
            profileDraft = walletSave.profile;
            resourcesDraft = mergeOffChainResources(walletSave.resources, cloud?.resources);
            axolsDraft = pickMostAxols(walletSave.axols, cloud?.axols, publicPlayer?.axols).map(withCosmetic);
            primeIds(axolsDraft);
            battleId.current = walletSave.battleIdCounter;
          }
        } catch (e) {
          console.warn("[chain] hydrate skipped:", e);
          setChainReady(false);
          if (hasSavedProgress) {
            if (walletSave) {
              profileDraft = walletSave.profile;
              resourcesDraft = mergeOffChainResources(walletSave.resources, cloud?.resources);
              axolsDraft = pickMostAxols(walletSave.axols, cloud?.axols, publicPlayer?.axols).map(withCosmetic);
              primeIds(axolsDraft);
              battleId.current = walletSave.battleIdCounter;
            }
          } else {
            const fresh = freshSave();
            profileDraft = fresh.profile;
            resourcesDraft = normalizeResources(fresh.resources);
            axolsDraft = fresh.axols.map(withCosmetic);
            primeIds(axolsDraft);
            battleId.current = fresh.battleIdCounter;
          }
        }
      } else if (!hasSavedProgress) {
        const fresh = freshSave();
        profileDraft = fresh.profile;
        resourcesDraft = normalizeResources(fresh.resources);
        axolsDraft = fresh.axols.map(withCosmetic);
        primeIds(axolsDraft);
        battleId.current = fresh.battleIdCounter;
        if (fresh.activeId != null) {
          setActiveId(fresh.activeId);
          setSelectedId(fresh.selectedId);
        }
      } else if (walletSave) {
        profileDraft = walletSave.profile;
        resourcesDraft = mergeOffChainResources(walletSave.resources, cloud?.resources);
        axolsDraft = pickMostAxols(walletSave.axols, cloud?.axols, publicPlayer?.axols).map(withCosmetic);
        primeIds(axolsDraft);
        battleId.current = walletSave.battleIdCounter;
      }

      if (publicKey) {
        const solax = await readSolaxBalance(connection, publicKey);
        resourcesDraft = { ...resourcesDraft, solax };
      }

      const gift = applyLaunchAirdrop(profileDraft, resourcesDraft, axolsDraft);
      if (gift.applied) {
        profileDraft = gift.profile;
        resourcesDraft = gift.resources;
        axolsDraft = gift.axols;
      }

      const eggRecovery = applyEggRecoveryAirdrop(profileDraft, resourcesDraft, axolsDraft);
      if (eggRecovery.applied) {
        profileDraft = eggRecovery.profile;
        resourcesDraft = eggRecovery.resources;
      }

      const energyRefill = applyEnergyRefillAirdrop(profileDraft, resourcesDraft);
      if (energyRefill.applied) {
        profileDraft = energyRefill.profile;
        resourcesDraft = energyRefill.resources;
      }

      primeIds(axolsDraft);
      setAxols(axolsDraft);
      setResources(normalizeResources(resourcesDraft));
      setProfile(normalizeProfile(profileDraft));
      setQuests(metaQuests);
      setBattleHistory(metaHistory);
      if (metaActive != null) setActiveId(metaActive);
      if (metaSelected != null) setSelectedId(metaSelected);
      if (metaDnaBonus != null) setLastDnaBonusAt(metaDnaBonus);
      if (metaPond) setPondLayouts(normalizePondLayouts(metaPond));
      if (cloud?.battleHistory) battleId.current = Math.max(battleId.current, ...metaHistory.map((b) => b.id), 0) + 1;

      setSaveReady(true);

      const restoredFromBackup =
        !walletSave?.axols.length &&
        axolsDraft.length > 0 &&
        ((cloud?.axols?.length ?? 0) > 0 || (publicPlayer?.axols.length ?? 0) > 0);

      const count = axolsDraft.length;
      toast(
        gift.applied
          ? "Launch gift! +5 eggs · +4 breeds per Solaxy"
          : eggRecovery.applied
            ? "Nursery restocked! +8 eggs ready for breeding."
            : energyRefill.applied
              ? isEnergyBoostActive()
                ? "Energy boost! 500 stamina for the next 24 hours."
                : "Energy refilled! Full stamina restored."
              : restoredFromBackup
            ? `Progress restored! ${count} Solax${count === 1 ? "y" : "ies"} back.`
            : count > 0
              ? `Welcome back! ${count} Solax${count === 1 ? "y" : "ies"}.`
              : ready
                ? "Wallet linked! Mint your first Solaxy at the DNA Core."
                : "Wallet linked! Your island awaits.",
      );
    };

    void hydrate();
    setWallet(shortAddr(walletAddress));
    setWalletFull(walletAddress);
    void fetchGlobalFeed().then(setFeed).catch(() => {});
    setScreen("home");
    setBreedOpen(false);
    sfx.startAmbient();
  }, [mounted, isLinked, walletAddress, chainClient]);

  // Log out when wallet disconnects (skip while connecting).
  useEffect(() => {
    if (!mounted || connecting || isLinked) return;
    loadedWalletRef.current = null;
    setSaveReady(false);
    setPondArranging(false);
    setPondArrangeView(null);
    apply(loggedOutSave());
    setWallet(null);
    setWalletFull(null);
    setFeed([]);
    setScreen("home");
    setBreedOpen(false);
  }, [mounted, isLinked, connecting]);

  // Patch any axols bred earlier in the session (before cosmetics shipped).
  useEffect(() => {
    if (!mounted) return;
    setAxols((list) => {
      const next = list.map(withCosmetic);
      return next.some((a, i) => a.cosmeticId !== list[i].cosmeticId) ? next : list;
    });
  }, [mounted]);

  // Auto-save progress — wallet-linked profiles (local cache + cloud).
  useEffect(() => {
    if (!mounted || !walletFull || !saveReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const snap = buildSave(snapshot());
      saveWallet(walletFull, snap);
      void postCloudSave({
        wallet: walletFull,
        profile: snap.profile,
        quests: snap.quests,
        battleHistory: snap.battleHistory,
        activeId: snap.activeId,
        selectedId: snap.selectedId,
        lastDnaBonusAt: snap.lastDnaBonusAt,
        pondLayouts: snap.pondLayouts,
        axols: snap.axols,
        resources: {
          dna: snap.resources.dna,
          eggs: snap.resources.eggs,
          energy: snap.resources.energy,
          maxEnergy: snap.resources.maxEnergy,
          streak: snap.resources.streak,
          items: snap.resources.items,
        },
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [mounted, walletFull, saveReady, axols, resources, profile, quests, battleHistory, activeId, selectedId, lastDnaBonusAt, pondLayouts]);

  // Sync public profile for global leaderboard & PvP matching.
  useEffect(() => {
    if (!mounted || !walletFull || needsUsername(profile)) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void syncPublicPlayer({
        wallet: walletFull,
        profile,
        axols,
        activeId,
        quests,
      });
    }, 800);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [mounted, walletFull, profile, axols, activeId, quests]);

  // Keep displayed SOLAX in sync with wallet SPL balance (no chain client required).
  useEffect(() => {
    if (!mounted || !publicKey) return;
    let cancelled = false;
    const syncBal = () => {
      void readSolaxBalance(connection, publicKey, resourcesRef.current.solax).then((solax) => {
        if (!cancelled) setResources((r) => ({ ...r, solax }));
      });
    };
    syncBal();
    const iv = setInterval(syncBal, 12_000);
    const onFocus = () => syncBal();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, [mounted, publicKey, connection]);

  // Poll the global live feed (shared by all players).
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    const load = () => {
      void fetchGlobalFeed()
        .then((items) => { if (!cancelled) setFeed(items); })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [wallet]);

  const announceFeed = useCallback((what: string, color = "#a463ff") => {
    const who = profileRef.current.name.trim() || "Trainer";
    setFeed((f) => [feedItem(who, what, color), ...f.filter((x) => x.t !== "now" || x.who !== who || x.what !== what)].slice(0, 12));
    void postGlobalFeed({ who, what, color, wallet: walletFull ?? undefined });
  }, [walletFull]);

  const recordEconomy = useCallback((amount: number) => {
    if (amount <= 0) return;
    void postEconomyStats({ spent: amount, burned: amount });
  }, []);

  const pushFeed = announceFeed;

  const walletSigner = useCallback(() => {
    const adapter = adapterWallet?.adapter;
    const stx =
      sendTransaction ??
      (adapter && "sendTransaction" in adapter && typeof adapter.sendTransaction === "function"
        ? adapter.sendTransaction.bind(adapter)
        : undefined);
    const stxn =
      signTransaction ??
      (adapter && "signTransaction" in adapter && typeof adapter.signTransaction === "function"
        ? adapter.signTransaction.bind(adapter)
        : undefined);
    return { publicKey, sendTransaction: stx, signTransaction: stxn };
  }, [adapterWallet, publicKey, sendTransaction, signTransaction]);

  const refreshSolax = useCallback(async (): Promise<number> => {
    if (!publicKey) return resourcesRef.current.solax;
    const solax = await readSolaxBalance(connection, publicKey, resourcesRef.current.solax);
    setResources((r) => ({ ...r, solax }));
    return solax;
  }, [connection, publicKey]);

  const requireWallet = () => {
    if (!wallet) {
      toast("Link your wallet to play.", { critical: true });
      return false;
    }
    if (needsUsername(profileRef.current)) {
      toast("Pick a trainer name first.", { critical: true });
      return false;
    }
    return true;
  };

  const applyChainState = useCallback(async () => {
    if (!chainClient) return;
    const state = await chainClient.refreshState();
    setAxols(state.axols.map(withCosmetic));
    setResources((r) => normalizeResources({
      ...r,
      solax: state.solax,
      energy: Math.max(r.energy, state.energy),
    }));
  }, [chainClient]);

  /** Transfer SOLAX to burn wallet, verify on-chain, refresh balance. */
  const burnAndRefresh = useCallback(
    async (cost: number): Promise<boolean> => {
      if (!requireWallet() || !publicKey) {
        toast("Connect wallet to spend SOLAX", { critical: true });
        return false;
      }
      const signer = walletSigner();
      if (!signer.sendTransaction && !signer.signTransaction) {
        toast("Wallet cannot sign transactions — reconnect your wallet", { critical: true });
        return false;
      }
      try {
        const displayBal = await readSolaxBalance(connection, publicKey, resourcesRef.current.solax);
        let held = await resolveSolaxTokenAccount(connection, publicKey);
        if (!held && displayBal >= cost) {
          await new Promise((r) => setTimeout(r, 500));
          held = await resolveSolaxTokenAccount(connection, publicKey);
        }
        const chainBal = held?.balance ?? displayBal;
        setResources((r) => ({ ...r, solax: Math.max(chainBal, r.solax) }));

        if (!held || chainBal < cost) {
          toast(
            held
              ? `Need ${cost.toLocaleString()} SOLAX in wallet (you have ${Math.floor(chainBal).toLocaleString()})`
              : displayBal >= cost
                ? "Still locating your SOLAX account — hard refresh and try again"
                : "No SOLAX token account found — buy on pump.fun first",
            { critical: true },
          );
          return false;
        }

        toast("Confirm SOLAX transfer in your wallet…", { critical: true });
        const sig = await transferSolaxToBurnWallet(connection, signer, cost, held);

        let verified = await verifySolaxBurnTransfer(connection, sig, publicKey, cost);
        if (!verified) {
          const res = await fetch("/api/verify-burn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signature: sig, wallet: publicKey.toBase58(), amount: cost }),
          });
          if (res.ok) {
            const data = (await res.json()) as { verified?: boolean };
            verified = !!data.verified;
          }
        }
        if (!verified) {
          console.warn("[burn] verify inconclusive but tx confirmed", sig);
        }

        const solax = await readSolaxBalance(connection, publicKey);
        setResources((r) => ({ ...r, solax: solax > 0 ? solax : Math.max(0, r.solax - cost) }));
        recordEconomy(cost);
        return true;
      } catch (e) {
        console.error("[burn]", e);
        const msg = e instanceof Error ? e.message : "Transaction cancelled or failed.";
        toast(msg.length > 100 ? "Transaction cancelled or failed." : msg, { critical: true });
        return false;
      }
    },
    [connection, publicKey, toast, recordEconomy, requireWallet, walletSigner],
  );

  const doRoll = async (_luck = 0): Promise<Axol | null> => {
    if (!requireWallet()) return null;

    const r = resourcesRef.current;
    const canOnChainMint = !!(chainClient && chainReady && r.solax >= COSTS.roll.solax);

    if (canOnChainMint && chainClient) {
      toast("Confirm mint in your wallet…", { critical: true });
      try {
        const { axol } = await chainClient.mintAxol();
        const rolled = withCosmetic(axol);
        await applyChainState();
        bumpQuest("rolls");
        grantProgression("hatch", COSTS.roll.solax);
        recordEconomy(COSTS.roll.solax);
        pushFeed(`minted ${rolled.rarity} ${CLASS_META[rolled.cls].name} on-chain!`, CLASS_META[rolled.cls].color);
        return rolled;
      } catch (e) {
        console.error("[mint]", e);
        toast("Transaction cancelled or failed.", { critical: true });
        return null;
      }
    }

    if (r.dna < COSTS.roll.dna) {
      toast("Not enough DNA — buy more at Harbor or claim the free bonus", { critical: true });
      return null;
    }
    if (r.energy < COSTS.roll.energy) {
      toast("Out of energy — refill below to keep spinning", { critical: true });
      return null;
    }

    setResources((prev) => ({
      ...prev,
      dna: prev.dna - COSTS.roll.dna,
      energy: prev.energy - COSTS.roll.energy,
    }));
    const rolled = withCosmetic(randomAxol({ rarity: rollRarity(_luck) }));
    setAxols((list) => [...list, rolled]);
    bumpQuest("rolls");
    grantProgression("hatch");
    pushFeed(`rolled a ${rolled.rarity} ${CLASS_META[rolled.cls].name}!`, CLASS_META[rolled.cls].color);
    return rolled;
  };

  const doBreed = async (aId: number, bId: number, solaxCost = 0): Promise<Axol | null> => {
    if (!requireWallet()) return null;
    const a = axols.find((x) => x.id === aId);
    const b = axols.find((x) => x.id === bId);
    if (!a || !b) return null;

    if (resources.eggs < COSTS.breed.eggs) {
      toast("Need 1 egg to breed");
      return null;
    }

    if (chainClient && chainReady) {
      if (resources.energy < ON_CHAIN_COSTS.breedEnergy) {
        toast("Not enough energy to breed.");
        return null;
      }
      toast("Confirm breed in your wallet…");
      try {
        const { child } = await chainClient.breed(aId, bId);
        const hatched = withCosmetic(child);
        await applyChainState();
        setSelectedId(hatched.id);
        bumpQuest("breeds");
        grantProgression("breed");
        pushFeed(`hatched Gen ${hatched.generation} ${CLASS_META[hatched.cls].name} on-chain!`, CLASS_META[hatched.cls].color);
        return hatched;
      } catch (e) {
        console.error("[breed]", e);
        toast("Transaction cancelled or failed.");
        return null;
      }
    }

    if (solaxCost > 0 && !(await burnAndRefresh(solaxCost))) return null;
    const child = breedAxol(a, b);
    setResources((r) => ({ ...r, eggs: r.eggs - COSTS.breed.eggs }));
    setAxols((list) => [...list.map((x) => (x.id === aId || x.id === bId ? { ...x, breedCount: x.breedCount + 1 } : x)), child]);
    setSelectedId(child.id);
    bumpQuest("breeds");
    grantProgression("breed", solaxCost);
    pushFeed(`hatched a Gen ${child.generation} ${CLASS_META[child.cls].name}!`, CLASS_META[child.cls].color);
    return child;
  };

  const doBattle = async (myId: number, enemyOverride?: Axol) => {
    if (!requireWallet()) return null;
    const mine = axols.find((x) => x.id === myId);
    if (!mine) return null;
    const enemy = enemyOverride ?? wildAxol(mine);

    if (chainClient && chainReady) {
      if (resources.energy < COSTS.battle.energy) {
        toast(`Need ${COSTS.battle.energy} energy to battle`);
        return null;
      }
      const opponentOnChain = await chainClient.fetchAxolExists(enemy.id);
      if (opponentOnChain) {
        toast("Confirm battle in your wallet…");
        try {
          const { won } = await chainClient.battle(myId, enemy.id, battleId.current++);
          await applyChainState();
          const result: BattleResult = {
            win: won,
            myRoll: won ? 100 : 40,
            enemyRoll: won ? 40 : 100,
            advantage: "none",
            rewardXp: won ? 40 : 15,
          };
          pushFeed(
            won ? `won an on-chain battle vs ${enemy.name}!` : `lost to ${enemy.name} on-chain…`,
            won ? "#54e07a" : "#ff6b6b",
          );
          return { mine, enemy, result };
        } catch (e) {
          console.error("[battle]", e);
          toast("Transaction cancelled or failed.");
          return null;
        }
      }
      toast("Practice battle — wild Solaxy (not on-chain yet).");
    }

    if (resources.energy < COSTS.battle.energy) {
      toast(`Need ${COSTS.battle.energy} energy to battle`);
      return null;
    }
    const result: BattleResult = resolveBattle(mine, enemy);
    const gain = solaxyXpGain(mine, result.rewardXp);
    setResources((r) => ({
      ...r,
      energy: Math.max(0, r.energy - COSTS.battle.energy),
      dna: r.dna + (result.win ? 5 : 0),
    }));
    setAxols((list) =>
      list.map((x) => {
        if (x.id !== myId) return x;
        return { ...x, xp: gain.xp, level: gain.level };
      }),
    );
    if (gain.levelsGained > 0) {
      setProfile((p) => applySolaxyLevelUps(p, gain.levelsGained));
    }
    pushFeed(result.win ? `won a battle vs ${enemy.name}!` : `lost to ${enemy.name}…`, result.win ? "#54e07a" : "#ff6b6b");
    return { mine, enemy, result };
  };

  const spendDna = useCallback((amount: number): boolean => {
    if (amount <= 0) return true;
    if (resources.dna < amount) return false;
    setResources((r) => ({ ...r, dna: r.dna - amount }));
    return true;
  }, [resources.dna]);

  const consumeHarborItems = useCallback((keys: string[]): boolean => {
    const items = normalizeItems(resources.items);
    for (const k of keys) {
      if ((items[k] ?? 0) < 1) return false;
    }
    setResources((r) => {
      const next = { ...normalizeItems(r.items) };
      for (const k of keys) next[k] = Math.max(0, (next[k] ?? 0) - 1);
      return { ...r, items: next };
    });
    return true;
  }, [resources.items]);

  const purchase = async (
    price: number,
    reward?: Partial<Resources>,
    label?: string,
    itemId?: string,
  ): Promise<boolean> => {
    if (!requireWallet()) return false;

    const itemEffect = itemId ? MARKET_ITEM_EFFECTS[itemId] : undefined;
    if (itemEffect?.kind === "xp") {
      const target = axols.find((a) => a.id === activeId) ?? axols[0];
      if (!target) {
        toast("Hatch a Solaxy before buying XP potions");
        return false;
      }
    }

    if (price > 0) {
      setPurchasing(true);
      try {
        if (!(await burnAndRefresh(price))) return false;
      } finally {
        setPurchasing(false);
      }
    }

    if (reward) {
      setResources((r) => {
        const b = normalizeResources(r);
        if (reward.dna) b.dna += reward.dna;
        if (reward.eggs) b.eggs += reward.eggs;
        if (reward.energy) b.energy = Math.min(r.maxEnergy, r.energy + reward.energy);
        return b;
      });
    }

    if (itemEffect?.kind === "booster") {
      setResources((r) => {
        const items = normalizeItems(r.items);
        items[itemEffect.key] = (items[itemEffect.key] ?? 0) + itemEffect.count;
        return { ...r, items };
      });
      if (label) toast(`${label} added — equip in DNA Core`);
    } else if (itemEffect?.kind === "xp") {
      const target = axols.find((a) => a.id === activeId) ?? axols[0]!;
      const gain = solaxyXpGain(target, itemEffect.amount);
      setAxols((list) =>
        list.map((x) => (x.id === target.id ? { ...x, xp: gain.xp, level: gain.level } : x)),
      );
      if (gain.levelsGained > 0) {
        setProfile((p) => applySolaxyLevelUps(p, gain.levelsGained));
      }
      sfx.powerUp();
      toast(`+${itemEffect.amount.toLocaleString()} XP for ${target.name}`);
    }

    if (label && price > 0) {
      announceFeed(`bought ${label}!`, "#2fe0cf");
      grantProgression("market_purchase", price);
    }

    return true;
  };

  const homePondAxols = useMemo(() => {
    return [...axols].sort((a, b) => b.level - a.level).slice(0, 5);
  }, [axols]);

  const openPondArrange = (view: "home" | "collection") => {
    sfx.click();
    setPondArrangeView(view);
    setPondArranging(true);
  };

  const closePondArrange = () => {
    sfx.click();
    setPondArranging(false);
    setPondArrangeView(null);
    toast("Pond layout saved!");
  };

  const setPondSpot = (axolId: number, spot: PondSpotPct) => {
    if (!pondArrangeView) return;
    setPondLayouts((layouts) => setLayoutSpot(layouts, pondArrangeView, axolId, spot));
  };

  const resetPondLayout = () => {
    if (!pondArrangeView) return;
    setPondLayouts((layouts) => resetLayoutView(layouts, pondArrangeView));
    toast("Pond positions reset to default");
  };

  const claimDnaBonus = (): boolean => {
    if (!requireWallet()) return false;
    const remaining = dnaBonusRemaining(lastDnaBonusAt);
    if (remaining > 0) {
      toast(`Next bonus in ${formatCooldown(remaining)}`);
      return false;
    }
    setResources((r) => ({ ...r, dna: r.dna + DNA_BONUS.amount }));
    setLastDnaBonusAt(Date.now());
    grantProgression("dna_bonus");
    sfx.dnaBonus();
    toast(`Claimed +${DNA_BONUS.amount} DNA!`);
    return true;
  };

  const addAxol = (a: Axol) => {
    setAxols((list) => [...list, a]);
    pushFeed(`acquired a ${a.rarity} ${CLASS_META[a.cls].name}!`, CLASS_META[a.cls].color);
  };

  const releaseAxol = (id: number): boolean => {
    if (!requireWallet()) return false;
    if (axols.length <= 1) {
      toast("Keep at least one Solaxy in your pond!");
      return false;
    }
    const a = axols.find((x) => x.id === id);
    if (!a) return false;

    const next = axols.filter((x) => x.id !== id);
    setAxols(next);
    setPondLayouts((layouts) => {
      const strip = (layout: PondLayout) => {
        const copy = { ...layout };
        delete copy[String(id)];
        return copy;
      };
      return { home: strip(layouts.home), collection: strip(layouts.collection) };
    });

    if (activeId === id) setActiveId(next[0]?.id ?? null);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);

    sfx.whoosh();
    toast(`Released ${CLASS_META[a.cls].name} #${a.id} — gone forever`);
    announceFeed(`released ${CLASS_META[a.cls].name} #${a.id}`, "#ff6b6b");
    return true;
  };

  // Buy `blocks` × 10 energy at 100k SOLAX each (capped at the max bar).
  const buyEnergy = async (blocks: number): Promise<boolean> => {
    if (!requireWallet()) return false;
    const cost = blocks * ENERGY_REFILL.solaxPerBlock;
    const gain = blocks * ENERGY_REFILL.perBlock;
    if (blocks <= 0) return false;
    if (!(await burnAndRefresh(cost))) return false;
    setResources((r) => ({ ...r, energy: Math.min(r.maxEnergy, r.energy + gain) }));
    grantProgression("energy_refill", cost);
    announceFeed(`refilled ${gain} energy`, "#ffd24a");
    return true;
  };

  const feedAxol = async (id: number): Promise<boolean> => {
    if (!requireWallet()) return false;
    const a = axols.find((x) => x.id === id);
    if (!a) return false;
    const cost = feedCost(a.level);
    if (!(await burnAndRefresh(cost))) return false;
    const gain = solaxyXpGain(a, feedXp(a.level));
    setAxols((list) =>
      list.map((x) => (x.id === id ? { ...x, xp: gain.xp, level: gain.level } : x)),
    );
    grantProgression("feed", cost, gain.levelsGained);
    announceFeed(`fed ${CLASS_META[a.cls].name} #${a.id}`, CLASS_META[a.cls].color);
    sfx.feed();
    return true;
  };

  const powerUp = async (id: number): Promise<boolean> => {
    if (!requireWallet()) return false;
    const a = axols.find((x) => x.id === id);
    if (!a) return false;
    const cost = powerUpCost(a.level);
    if (!(await burnAndRefresh(cost))) return false;
    setAxols((list) =>
      list.map((x) =>
        x.id === id
          ? {
              ...x,
              level: x.level + 1,
              hp: Math.round(x.hp * 1.06),
              attack: Math.round(x.attack * 1.06),
              defense: Math.round(x.defense * 1.06),
              speed: Math.round(x.speed * 1.06),
              skill: Math.round(x.skill * 1.06),
              morale: Math.round(x.morale * 1.06),
            }
          : x,
      ),
    );
    grantProgression("power_up", cost);
    announceFeed(`powered up ${CLASS_META[a.cls].name} #${a.id} to Lv.${a.level + 1}!`, CLASS_META[a.cls].color);
    sfx.powerUp();
    return true;
  };

  const setUsername = (raw: string) => {
    const name = formatTrainerName(raw);
    const base = name.split(".")[0] || name;
    setProfile((p) => ({
      ...p,
      name,
      empireName: `${base} Empire`,
      usernameSet: true,
    }));
    toast(`Welcome, ${name}!`);
    announceFeed("joined Solaxie!", "#c08bff");
    if (walletFull) {
      void syncPublicPlayer({
        wallet: walletFull,
        profile: { ...profileRef.current, name, empireName: `${base} Empire`, usernameSet: true },
        axols,
        activeId,
        quests,
      });
    }
  };

  const visitEmpire = (targetWallet: string) => {
    if (walletFull && targetWallet === walletFull) {
      setViewingPlayer(null);
      setScreen("empire");
      return;
    }
    void fetchPublicPlayer(targetWallet).then((p) => {
      if (!p) {
        toast("Trainer not found.");
        return;
      }
      setViewingPlayer(p);
      setScreen("empire");
    });
  };

  const world: WorldApi = {
    axols,
    resources,
    feed,
    quests,
    wallet,
    walletAddress: walletFull,
    loggedIn: !!wallet,
    connecting,
    purchasing,
    onConnect: async () => {
      sfx.click();
      sfx.startAmbient();
      if (connected && publicKey) return;
      setWalletModalOpen(true);
    },
    onDisconnect: async () => {
      if (walletFull) saveWallet(walletFull, buildSave(snapshot()));
      loadedWalletRef.current = null;
      setPondArranging(false);
      setPondArrangeView(null);
      try {
        await disconnect();
      } catch {
        /* wallet may already be disconnected */
      }
      apply(loggedOutSave());
      setWallet(null);
      setWalletFull(null);
      setChainReady(false);
      setFeed([]);
      setScreen("home");
      setBreedOpen(false);
      clearLastWallet();
      toast("Disconnected. Link your wallet to continue playing.");
    },
    profile,
    needsUsername: needsUsername(profile),
    setUsername,
    setAvatarId: (id: AvatarId) => {
      setProfile((p) => ({ ...p, avatarId: id }));
      toast("Profile icon updated!");
    },
    setEmpireName: (name: string) => setProfile((p) => ({ ...p, empireName: name })),
    battleHistory,
    recordBattle: (entry) => {
      setBattleHistory((h) => [{ ...entry, id: battleId.current++ }, ...h].slice(0, 50));
      setProfile((p) => {
        let next = applyProgressEvent(p, entry.win ? "battle_win" : "battle_loss");
        if (entry.win) next = { ...next, chestWins: Math.min(p.chestTarget, p.chestWins + 1) };
        if (next.level > p.level) {
          queueMicrotask(() => toast(`Trainer level up! Now Lv.${next.level}`));
        }
        return next;
      });
      if (entry.win) bumpQuest("wins");
      if (entry.win) {
        announceFeed(`won a battle with ${entry.axolName}!`, CLASS_META[entry.axolCls].color);
      } else {
        announceFeed(`lost a battle vs ${entry.opponent}`, "#ff6b6b");
      }
    },
    announceFeed,
    activeId,
    screen,
    setScreen: (s) => {
      if (!wallet) return;
      if (pondArranging) closePondArrange();
      setScreen(s);
    },
    selectedId,
    setSelectedId,
    openBreed: () => {
      if (!requireWallet()) return;
      setBreedOpen(true);
    },
    doRoll,
    doBreed,
    doBattle,
    visitEmpire,
    closeVisitedEmpire: () => setViewingPlayer(null),
    viewingPlayer,
    openLeaderboard: () => setLeaderboardOpen(true),
    purchase,
    addAxol,
    releaseAxol,
    feedAxol,
    powerUp,
    buyEnergy,
    setActive: (id: number) => {
      setActiveId(id);
      setSelectedId(id);
    },
    toast,
    refreshSolax,
    recordEconomy,
    lastDnaBonusAt,
    claimDnaBonus,
    pondLayouts,
    pondArranging,
    pondArrangeView,
    openPondArrange,
    closePondArrange,
    setPondSpot,
    spendDna,
    consumeHarborItems,
    resetPondLayout,
    chainReady,
  };

  const onBuilding = (t: Target) => (t === "breed" ? setBreedOpen(true) : setScreen(t));

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900">
        <img src="/logo.png" alt="Solaxie" className="w-64 animate-pulse" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <>
        <Head>
          <title>Solaxie — Tutorial</title>
        </Head>
        <TutorialScreen world={world} />
        <ConnectWalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} onError={toast} />
        <Toast msg={toastMsg} />
        <MuteButton />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Solaxie — Collect · Breed · Battle</title>
      </Head>

      {screen === "home" ? (
        <main className="relative min-h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/home-bg.png)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/10 to-ink-900/80" />
          <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 200px 60px rgba(8,5,18,0.75)" }} />

          <Atmosphere />

          <header className="absolute inset-x-0 top-0 z-30 flex flex-wrap items-center gap-2 bg-gradient-to-b from-ink-900/85 to-transparent px-3 py-2 sm:px-5">
            <img src="/logo.png" alt="Solaxie" className="mr-1 h-8 object-contain" />
            <ResourcePill icon="/icons/coin.png" label="SOLAX" value={Math.round(resources.solax).toLocaleString()} />
            <ResourcePill icon="/icons/dna.png" label="DNA" value={resources.dna} />
            <ResourcePill icon="/icons/egg.png" label="Eggs" value={resources.eggs} />
            <EnergyPill energy={resources.energy} max={resources.maxEnergy} streak={resources.streak} />
            <TwitterLink className="hidden sm:inline-flex" />
            <div className="ml-auto flex items-center gap-2">
              <TwitterLink className="sm:hidden" />
              <ProfileDropdown world={world} />
            </div>
          </header>

          <div className="absolute inset-0 z-20">
            {BUILDINGS.map((b) => (
              <BuildingButton key={b.id} b={b} onClick={() => onBuilding(b.target)} />
            ))}

            {axols.length > 0 && (
              <PondLayer
                axols={homePondAxols}
                layout={layoutForView(pondLayouts, "home")}
                arranging={false}
                variant="home"
                onSpotChange={setPondSpot}
                onPick={(a) => {
                  setSelectedId(a.id);
                  setScreen("collection");
                }}
              />
            )}
          </div>

          <aside className="absolute right-3 top-16 z-20 hidden flex-col gap-3 lg:flex">
            <QuestCard quests={quests} tickets={profile.activityTickets ?? 0} />
          </aside>

          <aside className="absolute bottom-[4.75rem] right-3 z-20 hidden lg:block">
            <SpendBurnMeter variant="sidebar" />
          </aside>

          <aside className="absolute bottom-[4.75rem] left-3 z-20 hidden max-h-40 w-64 md:block lg:max-h-44 lg:w-72">
            <FeedCard feed={feed} />
          </aside>

          <SpendBurnMeter variant="floating" />
        </main>
      ) : (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          {screen === "collection" && <CollectionScreen world={world} />}
          {screen === "dnacore" && <DnaCoreScreen world={world} />}
          {screen === "battle" && <ArenaScreen world={world} />}
          {screen === "market" && <MarketScreen world={world} />}
          {screen === "empire" && <EmpireScreen world={world} />}
          {screen === "settings" && <SettingsScreen world={world} />}
        </div>
      )}

      <BottomNav current={screen} onNav={setScreen} />

      {breedOpen && <BreedModal axols={axols} resources={resources} onBreed={doBreed} onClose={() => setBreedOpen(false)} />}

      {needsUsername(profile) && <UsernameModal onSubmit={setUsername} />}

      <LeaderboardModal
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        youWallet={walletFull}
        youName={profile.name}
        youTrophies={profile.trophies}
        youAvatar={avatarSrc(profile.avatarId)}
        onVisit={visitEmpire}
      />

      <Toast msg={toastMsg} />
      <ConnectWalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} onError={toast} />

      {pondArranging && pondArrangeView && (
        <PondArrangeOverlay
          axols={pondArrangeView === "home" ? homePondAxols : axols}
          layout={layoutForView(pondLayouts, pondArrangeView)}
          view={pondArrangeView}
          onSpotChange={setPondSpot}
          onDone={closePondArrange}
          onReset={resetPondLayout}
        />
      )}
    </>
  );
}

// --------------------------- shared bits ------------------------------------

function MuteButton() {
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(sfx.isMuted()), []);
  return (
    <button
      onClick={() => {
        const nowMuted = sfx.toggleMuted();
        setMuted(nowMuted);
        if (!nowMuted) sfx.startAmbient();
      }}
      aria-label={muted ? "Unmute" : "Mute"}
      className="fixed bottom-6 right-4 z-[60] grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-ink-900/75 text-base shadow-md backdrop-blur transition hover:scale-105 hover:border-white/40"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 animate-pop">
      <div className="rounded-full border border-white/15 bg-ink-850/95 px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-glow backdrop-blur">
        {msg}
      </div>
    </div>
  );
}

// --------------------------- HUD pieces ------------------------------------

function ResourcePill({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/70 py-1 pl-1 pr-3.5 shadow-md backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 shadow-inner">
        <img src={icon} alt="" className="h-6 w-6 object-contain" />
      </span>
      <div className="leading-none">
        <div className="font-display text-sm font-extrabold text-white">{value}</div>
        <div className="text-[0.5rem] uppercase tracking-wide text-white/50">{label}</div>
      </div>
    </div>
  );
}

function EnergyPill({ energy, max, streak }: { energy: number; max: number; streak: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isEnergyBoostActive(now)) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [now]);
  const boostLeft = energyBoostRemaining(now);
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/70 py-1 pl-1 pr-3.5 shadow-md backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-yellow-400/30 to-yellow-600/20">
        <img src="/icon-energy.png" alt="" className="h-6 w-6 object-contain" draggable={false} />
      </span>
      <div className="leading-none">
        <div className="font-display text-sm font-extrabold text-white">
          {energy}/{max}
        </div>
        <div className="text-[0.5rem] uppercase tracking-wide text-white/50">
          {boostLeft > 0 ? `500 boost · ${formatCooldown(boostLeft)} left` : `Energy · ${streak}d streak`}
        </div>
      </div>
    </div>
  );
}

function Torch({ side }: { side: "left" | "right" }) {
  return (
    <span className={`pointer-events-none absolute bottom-1 ${side === "left" ? "-left-3" : "-right-3"} flex flex-col items-center`}>
      <span className="relative -mb-0.5 h-4 w-3">
        <span
          className="absolute inset-0 origin-bottom animate-flicker rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 70%, #fff3b0 0%, #ffb02e 45%, #ff6a00 80%, transparent 100%)",
            filter: "blur(0.4px) drop-shadow(0 0 6px #ff8a00)",
            clipPath: "polygon(50% 0, 80% 45%, 70% 100%, 30% 100%, 20% 45%)",
          }}
        />
      </span>
      <span className="h-3 w-1 rounded-sm bg-gradient-to-b from-[#8a5a2b] to-[#5e3b1a]" />
    </span>
  );
}

function Flags({ accent }: { accent: string }) {
  return (
    <span className="pointer-events-none absolute -top-3 left-1/2 flex -translate-x-1/2 gap-3">
      {[-1, 1].map((d) => (
        <span key={d} className="relative">
          <span className="block h-4 w-px bg-white/40" />
          <span
            className="absolute left-px top-0 h-2.5 w-3 origin-left animate-wave"
            style={{
              background: accent,
              clipPath: "polygon(0 0, 100% 25%, 0 50%)",
              animationDelay: `${d === 1 ? 0.4 : 0}s`,
            }}
          />
        </span>
      ))}
    </span>
  );
}

function BuildingButton({ b, onClick }: { b: Building; onClick: () => void }) {
  const scale = b.scale ?? 1;
  return (
    <button
      onClick={onClick}
      className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: b.pos.left, top: b.pos.top }}
    >
      {b.aura ? (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 animate-aura rounded-full blur-2xl"
          style={{
            width: 160 * scale,
            height: 160 * scale,
            background: `radial-gradient(circle, ${b.accent}cc 0%, ${b.accent}55 42%, transparent 70%)`,
            opacity: b.aura,
          }}
        />
      ) : null}

      <div className="relative" style={{ transform: `scale(${scale})` }}>
        {b.flags ? <Flags accent={b.accent} /> : null}
        {b.torches ? (
          <>
            <Torch side="left" />
            <Torch side="right" />
          </>
        ) : null}

        <span
          className="relative grid h-14 w-14 place-items-center rounded-full border-2 text-2xl transition-transform duration-150 group-hover:scale-110"
          style={{
            background: `radial-gradient(circle at 38% 30%, ${b.accent}, ${b.accent}aa 55%, ${b.accent}66)`,
            borderColor: "rgba(255,255,255,0.55)",
            boxShadow: `0 8px 20px rgba(0,0,0,0.55), 0 0 22px ${b.accent}aa, inset 0 2px 6px rgba(255,255,255,0.45)`,
          }}
        >
          <span className="absolute left-2 top-1.5 h-3 w-4 rounded-full bg-white/55 blur-[2px]" />
          <img src={b.icon} alt="" className="relative h-10 w-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" draggable={false} />
        </span>
      </div>

      <div className="mt-2 flex flex-col items-center rounded-full border border-white/15 bg-ink-900/75 px-3 py-0.5 shadow-md backdrop-blur transition group-hover:border-white/40">
        <span className="whitespace-nowrap font-display text-[0.8rem] font-extrabold leading-tight text-white">{b.title}</span>
        <span className="text-[0.52rem] font-bold uppercase tracking-[0.18em]" style={{ color: b.accent }}>
          {b.sub}
        </span>
      </div>
    </button>
  );
}

function QuestCard({ quests, tickets }: { quests: Quests; tickets: number }) {
  const rows = [
    { label: "Win 3 battles", prog: Math.min(quests.wins, 3), total: 3 },
    { label: "Roll a Solaxy", prog: Math.min(quests.rolls, 1), total: 1 },
    { label: "Breed once", prog: Math.min(quests.breeds, 1), total: 1 },
  ];
  return (
    <div className="glass rounded-3xl p-4 shadow-panel">
      <div className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-widest text-brand-300">Daily Quests</div>
      <div className="space-y-1.5">
        {rows.map((r) => {
          const done = r.prog >= r.total;
          return (
            <div key={r.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[0.55rem] ${done ? "bg-emerald-400 text-black" : "bg-white/15"}`}>
                  {done ? "✓" : ""}
                </span>
                <span className="text-[0.72rem] text-white/90">{r.label}</span>
              </div>
              <span className="text-[0.62rem] font-bold text-white/50">
                {r.prog}/{r.total}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-col items-center justify-center gap-1 border-t border-white/10 pt-2">
        <div className="flex items-center gap-2">
          <img src="/icons/egg.png" alt="" className="h-6 w-6" />
          <span className="text-[0.66rem] font-bold text-white/80">Reward: Mystery Egg + activity tickets</span>
        </div>
        <span className="text-[0.58rem] font-bold text-violet-300/90">Season total: {tickets.toLocaleString()} tickets</span>
      </div>
    </div>
  );
}

function FeedCard({ feed }: { feed: FeedItem[] }) {
  return (
    <div className="glass rounded-3xl p-4 shadow-panel">
      <div className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-widest text-brand-300">Live Feed</div>
      <div className="space-y-1">
        {feed.slice(0, 6).map((f) => (
          <div key={f.id} className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[0.72rem] text-white/90">
              <b style={{ color: f.color }}>{f.who}</b> {f.what}
            </p>
            <span className="shrink-0 text-[0.55rem] text-white/40">{f.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "/icon-home.png" },
  { id: "battle", label: "Battle", icon: "/icon-arena.png" },
  { id: "collection", label: "Collection", icon: "/icon-collection.png" },
  { id: "market", label: "Market", icon: "/icon-market.png" },
  { id: "empire", label: "Empire", icon: "/icon-empire.png" },
  { id: "dnacore", label: "DNA Core", icon: "/icon-shrine.png" },
];

function BottomNav({ current, onNav }: { current: Screen; onNav: (m: Screen) => void }) {
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(sfx.isMuted()), []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-ink-900/90 to-transparent pb-3 pt-6">
      <div className="flex items-end gap-2 rounded-full border border-white/15 bg-ink-850/90 px-2.5 py-2 shadow-panel backdrop-blur">
        <button
          onClick={() => {
            const nowMuted = sfx.toggleMuted();
            setMuted(nowMuted);
            if (!nowMuted) sfx.startAmbient();
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          className="mb-1 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-base text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        {NAV.map((n) => {
          const active = current === n.id;
          return (
            <button key={n.label} onClick={() => onNav(n.id)} className="group flex flex-col items-center gap-1 px-1.5">
              <span
              className={`grid h-11 w-11 place-items-center rounded-full transition-all duration-150 ${
                active
                  ? "scale-110 border-2 border-white/50 bg-gradient-to-b from-brand-400 to-brand-600 shadow-glow"
                  : "border border-white/10 bg-white/5 opacity-85 group-hover:scale-105 group-hover:bg-white/15 group-hover:opacity-100"
              }`}
              >
                <img src={n.icon} alt="" className="h-7 w-7 object-contain drop-shadow" draggable={false} />
              </span>
              <span className={`text-[0.6rem] font-bold ${active ? "text-white" : "text-white/55"}`}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
