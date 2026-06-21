import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Head from "next/head";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Axol,
  BattleResult,
  CLASS_META,
  COSTS,
  ENERGY_REFILL,
  FeedItem,
  Resources,
  STARTING_RESOURCES,
  axolSprite,
  breedAxol,
  withCosmetic,
  chain,
  feedItem,
  randomAxol,
  resolveBattle,
  rollRarity,
  seedAxols,
  wildAxol,
  xpNeeded,
  feedCost,
  feedXp,
  powerUpCost,
  getIdCounter,
  primeIds,
  setIdCounter,
} from "@/lib/game";
import {
  buildSave,
  loadWalletSave,
  saveWallet,
  clearLastWallet,
  shortAddr,
  type GameSave,
} from "@/lib/save";
import { createChainClient } from "@/lib/chain";
import { fetchGlobalFeed, postGlobalFeed } from "@/lib/global-feed";
import { recordEconomy as postEconomyStats } from "@/lib/global-stats";
import { fetchPublicPlayer, syncPublicPlayer } from "@/lib/global-players";
import { sfx } from "@/lib/sfx";
import { BreedModal, UsernameModal } from "@/components/world/modals";
import { SpendBurnMeter } from "@/components/world/SpendBurnMeter";
import { LeaderboardModal } from "@/components/world/LeaderboardPanel";
import { avatarSrc } from "@/lib/profile";
import type { PublicPlayer } from "@/lib/public-player";
import Atmosphere from "@/components/world/Atmosphere";
import type { Screen, WorldApi } from "@/components/world/world";
import CollectionScreen from "@/components/world/screens/CollectionScreen";
import DnaCoreScreen from "@/components/world/screens/DnaCoreScreen";
import ArenaScreen from "@/components/world/screens/ArenaScreen";
import MarketScreen from "@/components/world/screens/MarketScreen";
import EmpireScreen from "@/components/world/screens/EmpireScreen";
import TutorialScreen from "@/components/world/screens/TutorialScreen";
import { ConnectWalletModal } from "@/components/world/ConnectWalletModal";
import { ProfileDropdown } from "@/components/world/ProfileDropdown";
import type { AvatarId, BattleHistoryEntry, TrainerProfile } from "@/lib/profile";
import { STARTER_PROFILE, needsUsername } from "@/lib/profile";

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

const POND_SPOTS = [
  { left: "42%", top: "52%" },
  { left: "57%", top: "48%" },
  { left: "48%", top: "65%" },
  { left: "63%", top: "61%" },
  { left: "35%", top: "63%" },
];

function loggedOutSave(): GameSave {
  return buildSave({
    axols: [],
    resources: { solax: 0, dna: 0, eggs: 0, energy: 0, maxEnergy: 100, streak: 0 },
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

function applySave(
  save: GameSave,
  set: {
    setAxols: (v: Axol[]) => void;
    setResources: (v: Resources) => void;
    setProfile: (v: TrainerProfile) => void;
    setQuests: (v: { rolls: number; breeds: number; wins: number }) => void;
    setBattleHistory: (v: BattleHistoryEntry[]) => void;
    setActiveId: (v: number | null) => void;
    setSelectedId: (v: number | null) => void;
    battleId: MutableRefObject<number>;
  },
) {
  setIdCounter(save.idCounter);
  primeIds(save.axols);
  set.setAxols(save.axols.map(withCosmetic));
  set.setResources(save.resources);
  set.setProfile(save.profile);
  set.setQuests(save.quests);
  set.setBattleHistory(save.battleHistory);
  set.setActiveId(save.activeId);
  set.setSelectedId(save.selectedId);
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
    wallet: adapterWallet,
  } = useWallet();
  const phantomKey =
    typeof window !== "undefined"
      ? (window as Window & { phantom?: { solana?: { publicKey?: { toBase58: () => string } } } }).phantom?.solana?.publicKey?.toBase58()
      : null;
  const walletAddress =
    publicKey?.toBase58() ?? adapterWallet?.adapter.publicKey?.toBase58() ?? phantomKey ?? null;
  const isLinked = connected || !!adapterWallet?.adapter.connected || !!phantomKey;
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
  const [profile, setProfile] = useState<TrainerProfile>(STARTER_PROFILE);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [battleHistory, setBattleHistory] = useState<BattleHistoryEntry[]>([]);
  const battleId = useRef(1);
  const [quests, setQuests] = useState({ rolls: 0, breeds: 0, wins: 0 });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState<PublicPlayer | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const apply = (save: GameSave) =>
    applySave(save, { setAxols, setResources, setProfile, setQuests, setBattleHistory, setActiveId, setSelectedId, battleId });

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

  // Load save when wallet connects.
  useEffect(() => {
    if (!mounted || !isLinked || !walletAddress) return;
    if (loadedWalletRef.current === walletAddress) return;
    loadedWalletRef.current = walletAddress;

    const walletSave = loadWalletSave(walletAddress);
    if (walletSave) {
      apply(walletSave);
      toast(`Welcome back! ${walletSave.axols.length} Solax${walletSave.axols.length === 1 ? "y" : "ies"} restored.`);
    } else {
      const start = freshSave();
      apply(start);
      saveWallet(walletAddress, start);
      toast("Wallet linked! Your island awaits.");
    }
    setWallet(shortAddr(walletAddress));
    setWalletFull(walletAddress);
    void fetchGlobalFeed().then(setFeed).catch(() => {});
    setScreen("home");
    setBreedOpen(false);
    sfx.startAmbient();

    void (async () => {
      if (!chainClient) return;
      try {
        const ready = await chainClient.isReady();
        if (ready) await chainClient.ensurePlayer("Trainer");
      } catch (e) {
        console.warn("[chain] init_player skipped:", e);
      }
    })();
  }, [mounted, isLinked, walletAddress, chainClient]);

  // Log out when wallet disconnects (skip while connecting).
  useEffect(() => {
    if (!mounted || connecting || isLinked) return;
    loadedWalletRef.current = null;
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

  // Auto-save progress — wallet-linked profiles only.
  useEffect(() => {
    if (!mounted || !walletFull) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWallet(walletFull, buildSave(snapshot()));
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [mounted, walletFull, axols, resources, profile, quests, battleHistory, activeId, selectedId]);

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

  const recordEconomy = useCallback((spent: number, burned?: number) => {
    const b = burned ?? spent;
    if (spent <= 0 && b <= 0) return;
    void postEconomyStats({ spent, burned: b });
  }, []);

  const pushFeed = announceFeed;

  const requireWallet = () => {
    if (!wallet) {
      toast("Link your wallet to play.");
      return false;
    }
    if (needsUsername(profileRef.current)) {
      toast("Pick a trainer name first.");
      return false;
    }
    return true;
  };

  // ---- Actions (local state; chain calls stubbed) ----
  const doRoll = async (luck = 0): Promise<Axol | null> => {
    if (!requireWallet()) return null;
    await chain.roll(); // TODO: real mint
    let rolled: Axol | null = null;
    setResources((r) => {
      if (r.dna < COSTS.roll.dna || r.energy < COSTS.roll.energy) return r;
      rolled = withCosmetic(randomAxol({ rarity: rollRarity(luck) }));
      return { ...r, solax: r.solax - COSTS.roll.solax, dna: r.dna - COSTS.roll.dna, energy: r.energy - COSTS.roll.energy };
    });
    if (!rolled) return null;
    setAxols((list) => [...list, rolled!]);
    setQuests((q) => ({ ...q, rolls: q.rolls + 1 }));
    if (COSTS.roll.solax > 0) recordEconomy(COSTS.roll.solax, COSTS.roll.solax);
    pushFeed(`rolled a ${rolled!.rarity} ${CLASS_META[rolled!.cls].name}!`, CLASS_META[rolled!.cls].color);
    return rolled;
  };

  const doBreed = async (aId: number, bId: number, extraFee = 0): Promise<Axol | null> => {
    if (!requireWallet()) return null;
    const a = axols.find((x) => x.id === aId);
    const b = axols.find((x) => x.id === bId);
    if (!a || !b) return null;
    const solaxCost = COSTS.breed.solax + extraFee;
    if (resources.solax < solaxCost || resources.eggs < COSTS.breed.eggs) return null;
    await chain.breed(aId, bId); // TODO: real breed
    const child = breedAxol(a, b);
    setResources((r) => ({ ...r, solax: r.solax - solaxCost, eggs: r.eggs - COSTS.breed.eggs }));
    setAxols((list) => [...list.map((x) => (x.id === aId || x.id === bId ? { ...x, breedCount: x.breedCount + 1 } : x)), child]);
    setSelectedId(child.id);
    setQuests((q) => ({ ...q, breeds: q.breeds + 1 }));
    recordEconomy(solaxCost, solaxCost);
    pushFeed(`hatched a Gen ${child.generation} ${CLASS_META[child.cls].name}!`, CLASS_META[child.cls].color);
    return child;
  };

  const doBattle = async (myId: number, enemyOverride?: Axol) => {
    if (!requireWallet()) return null;
    const mine = axols.find((x) => x.id === myId);
    if (!mine) return null;
    if (resources.energy < COSTS.battle.energy) return null;
    const enemy = enemyOverride ?? wildAxol(mine);
    await chain.battle(myId, enemy.id); // TODO: real battle
    const result: BattleResult = resolveBattle(mine, enemy);
    setResources((r) => ({ ...r, energy: Math.max(0, r.energy - 10), solax: r.solax + result.rewardSolax, dna: r.dna + (result.win ? 5 : 0) }));
    setAxols((list) =>
      list.map((x) => {
        if (x.id !== myId) return x;
        const need = xpNeeded(x.level);
        let xp = x.xp + result.rewardXp;
        let level = x.level;
        if (xp >= need) { level += 1; xp -= need; }
        return { ...x, xp, level };
      })
    );
    if (result.win) setQuests((q) => ({ ...q, wins: q.wins + 1 }));
    pushFeed(result.win ? `won a battle vs ${enemy.name}!` : `lost to ${enemy.name}…`, result.win ? "#54e07a" : "#ff6b6b");
    return { mine, enemy, result };
  };

  const purchase = async (
    price: number,
    reward?: Partial<Resources>,
    label?: string,
    itemId?: string,
  ): Promise<boolean> => {
    if (!requireWallet()) return false;

    if (price > 0 && itemId) {
      if (!chainClient) {
        toast("Wallet not ready — reconnect and try again.");
        return false;
      }
      setPurchasing(true);
      toast("Confirm the purchase in your wallet…");
      try {
        const ready = await chainClient.isReady();
        if (!ready) {
          toast("Game program not deployed on this network yet.");
          return false;
        }
        await chainClient.shopPurchase(price, itemId);
      } catch (e) {
        console.error("[purchase]", e);
        toast("Transaction cancelled or failed.");
        return false;
      } finally {
        setPurchasing(false);
      }
    } else if (price > 0) {
      if (resources.solax < price) return false;
      setResources((r) => ({ ...r, solax: r.solax - price }));
      recordEconomy(price, price);
    }

    if (reward) {
      setResources((r) => {
        const b = { ...r };
        if (reward.dna) b.dna += reward.dna;
        if (reward.eggs) b.eggs += reward.eggs;
        if (reward.solax) b.solax += reward.solax;
        if (reward.energy) b.energy = Math.min(r.maxEnergy, r.energy + reward.energy);
        return b;
      });
    }

    if (label && price > 0) {
      announceFeed(`bought ${label}!`, "#2fe0cf");
    }

    return true;
  };

  const addAxol = (a: Axol) => {
    setAxols((list) => [...list, a]);
    pushFeed(`acquired a ${a.rarity} ${CLASS_META[a.cls].name}!`, CLASS_META[a.cls].color);
  };

  // Buy `blocks` × 10 energy at 100k SOLAX each (capped at the max bar).
  const buyEnergy = (blocks: number): boolean => {
    if (!requireWallet()) return false;
    const cost = blocks * ENERGY_REFILL.solaxPerBlock;
    const gain = blocks * ENERGY_REFILL.perBlock;
    if (resources.solax < cost || blocks <= 0) return false;
    setResources((r) => ({ ...r, solax: r.solax - cost, energy: Math.min(r.maxEnergy, r.energy + gain) }));
    recordEconomy(cost, cost);
    announceFeed(`refilled ${gain} energy`, "#ffd24a");
    return true;
  };

  const feedAxol = (id: number): boolean => {
    if (!requireWallet()) return false;
    const a = axols.find((x) => x.id === id);
    if (!a) return false;
    const cost = feedCost(a.level);
    if (resources.solax < cost) return false;
    setResources((r) => ({ ...r, solax: r.solax - cost }));
    setAxols((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        const need = xpNeeded(x.level);
        let xp = x.xp + feedXp(x.level);
        let level = x.level;
        if (xp >= need) { level += 1; xp -= need; }
        return { ...x, xp, level };
      })
    );
    recordEconomy(cost, cost);
    announceFeed(`fed ${CLASS_META[a.cls].name} #${a.id}`, CLASS_META[a.cls].color);
    return true;
  };

  const powerUp = (id: number): boolean => {
    if (!requireWallet()) return false;
    const a = axols.find((x) => x.id === id);
    if (!a) return false;
    const cost = powerUpCost(a.level);
    if (resources.solax < cost) return false;
    setResources((r) => ({ ...r, solax: r.solax - cost }));
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
          : x
      )
    );
    recordEconomy(cost, cost);
    announceFeed(`powered up ${CLASS_META[a.cls].name} #${a.id} to Lv.${a.level + 1}!`, CLASS_META[a.cls].color);
    return true;
  };

  const setUsername = (name: string) => {
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
      try {
        await disconnect();
      } catch {
        /* wallet may already be disconnected */
      }
      apply(loggedOutSave());
      setWallet(null);
      setWalletFull(null);
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
      if (entry.win) {
        setProfile((p) => ({
          ...p,
          chestWins: Math.min(p.chestTarget, p.chestWins + 1),
          trophies: Math.max(0, p.trophies + entry.trophiesDelta),
        }));
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
    feedAxol,
    powerUp,
    buyEnergy,
    setActive: setActiveId,
    toast,
    recordEconomy,
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
            <div className="ml-auto">
              <ProfileDropdown world={world} />
            </div>
          </header>

          <div className="absolute inset-0 z-20">
            {BUILDINGS.map((b) => (
              <BuildingButton key={b.id} b={b} onClick={() => onBuilding(b.target)} />
            ))}

            <div className="pointer-events-none absolute left-1/2 top-[37%] -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="rounded-lg border-2 border-[#5e3b1a] bg-gradient-to-b from-[#c98a4b] to-[#8a5a2b] px-4 py-1 shadow-lg">
                <span className="font-display font-extrabold tracking-wide text-[#fff4e0]" style={{ textShadow: "0 2px 0 #6b4220" }}>
                  YOUR POND
                </span>
              </div>
              <div className="mx-auto mt-1 w-fit rounded-full bg-ink-900/70 px-3 py-0.5 text-[0.62rem] font-semibold text-white/80">
                {axols.length} Solax{axols.length === 1 ? "y" : "ies"} living here
              </div>
            </div>

            {[...axols].sort((a, b) => b.id - a.id).slice(0, 5).map((a, i) => (
              <PondAxol key={a.id} axol={a} pos={POND_SPOTS[i % POND_SPOTS.length]} delay={i * 0.4} onClick={() => { setSelectedId(a.id); setScreen("collection"); }} />
            ))}
          </div>

          <aside className="absolute right-3 top-16 z-20 hidden w-60 lg:block">
            <QuestCard quests={quests} />
          </aside>

          <aside className="absolute bottom-24 left-3 z-20 hidden w-72 md:block">
            <FeedCard feed={feed} />
          </aside>

          <SpendBurnMeter />
        </main>
      ) : (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          {screen === "collection" && <CollectionScreen world={world} />}
          {screen === "dnacore" && <DnaCoreScreen world={world} />}
          {screen === "battle" && <ArenaScreen world={world} />}
          {screen === "market" && <MarketScreen world={world} />}
          {screen === "empire" && <EmpireScreen world={world} />}
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
      <MuteButton />
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
      className="fixed bottom-24 right-3 z-[60] grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-ink-900/75 text-lg shadow-md backdrop-blur transition hover:scale-105 hover:border-white/40"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
          <path d="M16 9l5 5M21 9l-5 5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
          <path d="M15.5 8.5a5 5 0 010 7" strokeLinecap="round" />
          <path d="M18 6a8.5 8.5 0 010 12" strokeLinecap="round" />
        </svg>
      )}
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
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/70 py-1 pl-1 pr-3.5 shadow-md backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-yellow-400/30 to-yellow-600/20">
        <img src="/icon-energy.png" alt="" className="h-6 w-6 object-contain" draggable={false} />
      </span>
      <div className="leading-none">
        <div className="font-display text-sm font-extrabold text-white">
          {energy}/{max}
        </div>
        <div className="text-[0.5rem] uppercase tracking-wide text-white/50">Energy · {streak}d streak</div>
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

function PondAxol({ axol, pos, delay, onClick }: { axol: Axol; pos: { left: string; top: string }; delay: number; onClick: () => void }) {
  const color = CLASS_META[axol.cls].color;
  const size = 84;
  return (
    <button
      onClick={onClick}
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="mb-1 rounded-md bg-ink-900/70 px-2 py-0.5 text-center opacity-90 transition group-hover:opacity-100">
        <div className="whitespace-nowrap text-[0.62rem] font-extrabold leading-tight text-white">
          {CLASS_META[axol.cls].name} #{axol.id}
        </div>
        <div className="text-[0.5rem] text-white/60">{axol.status}</div>
      </div>

      <div className="relative transition-transform duration-150 group-hover:scale-105" style={{ width: size, height: size + 16 }}>
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 4, width: size * 0.78, height: size * 0.3 }}>
          <span
            className="absolute left-1/2 top-1/2 animate-ripple rounded-[50%] border border-cyan-100/60"
            style={{ width: "100%", height: "100%", animationDelay: `${delay}s` }}
          />
          <span
            className="absolute left-1/2 top-1/2 animate-ripple rounded-[50%] border border-cyan-100/40"
            style={{ width: "100%", height: "100%", animationDelay: `${delay + 1.7}s` }}
          />
        </div>

        <span
          className="absolute bottom-1 left-1/2 animate-contact rounded-[50%] bg-black/55 blur-md"
          style={{ width: size * 0.56, height: size * 0.16, animationDelay: `${delay}s` }}
        />
        <span
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full blur-xl"
          style={{ width: size * 0.5, height: size * 0.32, background: `${color}30` }}
        />

        <span className="absolute left-2 top-4 h-1 w-1 animate-sparkle rounded-full bg-white" style={{ animationDelay: `${delay + 0.3}s` }} />
        <span className="absolute right-3 top-7 h-1.5 w-1.5 animate-sparkle rounded-full" style={{ background: color, animationDelay: `${delay + 1.2}s` }} />
        <span className="absolute right-6 top-2 h-1 w-1 animate-sparkle rounded-full bg-white" style={{ animationDelay: `${delay + 2.1}s` }} />

        <div className="absolute inset-x-0 top-0 animate-bob" style={{ animationDelay: `${delay}s` }}>
          <div className="origin-bottom animate-breathe" style={{ animationDelay: `${delay}s` }}>
            <img
              src={axolSprite(axol)}
              alt={CLASS_META[axol.cls].name}
              className="mx-auto"
              style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 7px 6px rgba(0,0,0,0.4)) drop-shadow(0 0 12px ${CLASS_META[axol.cls].color}44)` }}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function QuestCard({ quests }: { quests: { rolls: number; breeds: number; wins: number } }) {
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
      <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/10 pt-2">
        <img src="/icons/egg.png" alt="" className="h-6 w-6" />
        <span className="text-[0.66rem] font-bold text-white/80">Reward: Mystery Egg</span>
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
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-ink-900/90 to-transparent pb-3 pt-6">
      <div className="flex items-end gap-1 rounded-full border border-white/15 bg-ink-850/90 px-2.5 py-2 shadow-panel backdrop-blur">
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
